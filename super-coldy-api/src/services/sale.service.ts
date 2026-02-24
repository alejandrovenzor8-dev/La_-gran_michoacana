/**
 * Servicio de Ventas
 * Maneja toda la lógica de negocio relacionada con ventas y transacciones
 */

import { Prisma, PaymentMethod, SaleStatus, Source, InventoryMovementType } from '@prisma/client';
import prisma from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logger } from '../utils/logger.js';
import type {
  CreateSaleInput,
  SaleResponse,
  SaleFilters,
  DailySalesStats,
  SaleListResponse,
} from '../types/sale.types.js';

/**
 * Calcula el offset (en minutos) entre UTC y una timezone específica
 * para una fecha dada
 */
function getTimezoneOffsetMinutes(timezone: string, date: Date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const partsMap = new Map(parts.map((p) => [p.type, p.value]));

    const localDate = new Date(
      parseInt(partsMap.get('year')!),
      parseInt(partsMap.get('month')!) - 1,
      parseInt(partsMap.get('day')!),
      parseInt(partsMap.get('hour')!),
      parseInt(partsMap.get('minute')!),
      parseInt(partsMap.get('second')!)
    );

    // Diferencia en minutos entre UTC y la zona horaria
    return Math.round((date.getTime() - localDate.getTime()) / 60000);
  } catch (error) {
    logger.warn(`Error calculating timezone offset for ${timezone}:`, error);
    // Default a UTC-6 (México)
    return -360;
  }
}

/**
 * Convierte YYYY-MM-DD en una zona horaria a rango UTC
 * Ej: "2026-02-20" en UTC-6 → Feb 20, 2026 06:00 UTC a Feb 21, 2026 05:59:59 UTC
 */
function convertLocalDateToUTCRange(
  dateString: string,
  timezone: string
): { start: Date; end: Date } {
  const [year, month, day] = dateString.split('-').map(Number);

  // Crear una fecha de "medianoche" en la zona horaria especificada
  const localMidnight = new Date(year, month - 1, day, 0, 0, 0, 0);

  // Calcular el offset para esa fecha
  const offsetMinutes = getTimezoneOffsetMinutes(timezone, localMidnight);

  // Convertir a UTC sumando el offset (offset es UTC - local, entonces UTC = local + offset)
  const startUTC = new Date(localMidnight.getTime() + offsetMinutes * 60 * 1000);

  // Fin del día: 23:59:59 en la zona horaria local
  const localEndOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
  const endUTC = new Date(localEndOfDay.getTime() + offsetMinutes * 60 * 1000);

  return { start: startUTC, end: endUTC };
}

/**
 * Traduce nombre de día en inglés (en-US) a español
 * Mon → Lun, Tue → Mar, etc.
 */
function translateDayNameToSpanish(englishDayName: string): string {
  const dayMap: Record<string, string> = {
    'Sun': 'Dom',
    'Mon': 'Lun',
    'Tue': 'Mar',
    'Wed': 'Mié',
    'Thu': 'Jue',
    'Fri': 'Vie',
    'Sat': 'Sáb',
  };
  return dayMap[englishDayName] || englishDayName;
}

class SaleService {
  /**
   * Crear una nueva venta
   * Valida productos, stock, calcula montos y registra la transacción
   */
  async createSale(
    data: CreateSaleInput,
    userId: number,
    requesterRole?: string
  ): Promise<SaleResponse> {
    try {
      // Validar que haya items
      if (!data.items || data.items.length === 0) {
        throw new AppError('La venta debe tener al menos un item', 400);
      }

      // Obtener la sucursal del usuario para asignarla a la venta
      // IMPORTANTE: Todas las ventas se registran con la sucursal del usuario que las crea
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { branchId: true, username: true, role: true },
      });

      const normalizedBranchId = data.branchId !== undefined ? Number(data.branchId) : undefined;

      const userRole = (requesterRole || user?.role || '').toUpperCase().trim();
      const isAdmin = userRole === 'ADMIN';

      let branchIdToUse: number | undefined;
      if (isAdmin) {
        if (!Number.isNaN(normalizedBranchId)) {
          branchIdToUse = normalizedBranchId;
        }

        if (!branchIdToUse) {
          throw new AppError(
            'Selecciona una sucursal para registrar la venta.',
            400
          );
        }
      } else {
        branchIdToUse = user?.branchId ?? undefined;
        
        if (!branchIdToUse) {
          throw new AppError(
            `El usuario no tiene una sucursal asignada. Contacta al administrador para asignar una sucursal.`,
            400
          );
        }
      }

      // Usar transacción de Prisma
      const sale = await prisma.$transaction(async (tx) => {
        // Validar que todos los productos existan y estén activos
        const productIds = data.items.map((item) => parseInt(item.productId as any) || 0);
        const products = await tx.product.findMany({
          where: {
            id: { in: productIds },
            active: true,
          },
        });

        if (products.length !== productIds.length) {
          throw new AppError('Uno o más productos no existen o están inactivos', 404);
        }

        // Validar stock suficiente
        for (const item of data.items) {
          const productId = parseInt(item.productId as any) || 0;
          const product = products.find((p) => p.id === productId);
          if (!product) {
            throw new AppError(`Producto no encontrado: ${item.productName}`, 404);
          }
          if (product.stock < item.quantity) {
            throw new AppError(
              `Stock insuficiente para ${item.productName}. Disponible: ${product.stock}`,
              400
            );
          }
        }

        // Calcular totales
        const subtotal = data.items.reduce((sum, item) => sum + item.subtotal, 0);
        const discount = data.discount || 0;
        const tax = data.tax || 0;
        const total = subtotal - discount + tax;

        // Validar monto recibido para efectivo
        let changeAmount: number | undefined;
        if (data.paymentMethod === PaymentMethod.EFECTIVO) {
          if (!data.amountReceived) {
            throw new AppError('Monto recibido requerido para pago en efectivo', 400);
          }
          if (data.amountReceived < total) {
            throw new AppError(
              `Monto insuficiente. Total: ${total}, Recibido: ${data.amountReceived}`,
              400
            );
          }
          changeAmount = data.amountReceived - total;
        }

        // Crear la venta (la fecha se asigna automáticamente por el servidor)
        const newSale = await tx.sale.create({
          data: {
            userId,
            branchId: branchIdToUse, // La venta se registra en la sucursal seleccionada
            subtotal: new Prisma.Decimal(subtotal),
            total: new Prisma.Decimal(total),
            discount: new Prisma.Decimal(discount),
            tax: new Prisma.Decimal(tax),
            paymentMethod: (data.paymentMethod as PaymentMethod),
            amountReceived: data.amountReceived ? new Prisma.Decimal(data.amountReceived) : undefined,
            changeAmount: changeAmount ? new Prisma.Decimal(changeAmount) : undefined,
            status: SaleStatus.COMPLETED,
            notes: data.notes,
            source: (data.source as Source) || Source.DESKTOP,
            items: {
              createMany: {
                data: data.items.map((item) => ({
                  productId: parseInt(item.productId as any) || 0,
                  productName: item.productName,
                  quantity: item.quantity,
                  unitPrice: new Prisma.Decimal(item.unitPrice),
                  subtotal: new Prisma.Decimal(item.subtotal),
                  discount: new Prisma.Decimal(item.discount || 0),
                })),
              },
            },
          },
          include: {
            user: {
              select: { id: true, username: true, fullName: true },
            },
            items: true,
          },
        });

        // Actualizar stock y crear movimientos de inventario
        for (const item of data.items) {
          const productId = parseInt(item.productId as any) || 0;
          const product = products.find((p) => p.id === productId)!;
          const previousStock = product.stock;

          // Decrementar stock
          await tx.product.update({
            where: { id: productId },
            data: {
              stock: { decrement: item.quantity },
            },
          });

          // Crear movimiento de inventario
          await tx.inventoryMovement.create({
            data: {
              productId,
              userId,
              type: InventoryMovementType.SALIDA,
              quantity: -item.quantity,
              previousStock,
              newStock: previousStock - item.quantity,
              reason: `Venta #${newSale.id}`,
              referenceId: newSale.id,
            },
          });
        }

        return newSale;
      });

      logger.info(`Venta creada: ${sale.id}`, {
        userId,
        total: Number(sale.total),
        items: sale.items.length,
      });

      return this.formatSaleResponse(sale);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al crear venta', error);
      throw new AppError('Error al crear venta', 500);
    }
  }

  /**
   * Obtener una venta por ID
   */
  async getSaleById(saleId: number): Promise<SaleResponse> {
    try {
      const sale = await prisma.sale.findUnique({
        where: { id: saleId },
        include: {
          user: {
            select: { id: true, username: true, fullName: true },
          },
          items: true,
        },
      });

      if (!sale) {
        throw new AppError('Venta no encontrada', 404);
      }

      return this.formatSaleResponse(sale);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al obtener venta', error);
      throw new AppError('Error al obtener venta', 500);
    }
  }

  /**
   * Obtener todas las ventas con filtros y paginación
   */
  async getAllSales(filters: SaleFilters): Promise<SaleListResponse> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const skip = (page - 1) * limit;

      // Construir where clause
      const where: Prisma.SaleWhereInput = {};

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          const startDate = new Date(filters.startDate);
          where.createdAt.gte = new Date(Date.UTC(
            startDate.getUTCFullYear(),
            startDate.getUTCMonth(),
            startDate.getUTCDate(),
            0, 0, 0, 0
          ));
        }
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          where.createdAt.lte = new Date(Date.UTC(
            endDate.getUTCFullYear(),
            endDate.getUTCMonth(),
            endDate.getUTCDate(),
            23, 59, 59, 999
          ));
        }
      }

      if (filters.userId) {
        where.userId = parseInt(filters.userId as any) || 0;
      }

      if (filters.paymentMethod) {
        where.paymentMethod = filters.paymentMethod as PaymentMethod;
      }

      if (filters.status) {
        where.status = filters.status as SaleStatus;
      }

      if (filters.source) {
        where.source = filters.source as Source;
      }

      if (filters.branchId) {
        where.branchId = filters.branchId;
      }

      // Buscar ventas
      const sales = await prisma.sale.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true, fullName: true },
          },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      // Contar total
      const total = await prisma.sale.count({ where });

      return {
        sales: sales.map((sale) => this.formatSaleResponse(sale)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al obtener ventas', error);
      throw new AppError('Error al obtener ventas', 500);
    }
  }

  /**
   * Obtener ventas y estadísticas de un día
   */
  async getDailySales(
    dateParam?: string | Date,
    timezone: string = 'America/Mexico_City'
  ): Promise<{ sales: SaleResponse[]; stats: DailySalesStats }> {
    try {
      let startOfDay: Date;
      let endOfDay: Date;

      if (dateParam) {
        if (typeof dateParam === 'string') {
          // Formato esperado: YYYY-MM-DD
          // Convertir a rango UTC considerando la timezone
          const range = convertLocalDateToUTCRange(dateParam, timezone);
          startOfDay = range.start;
          endOfDay = range.end;
        } else {
          // Si es una Date, trabajar directamente en UTC
          const yearUTC = dateParam.getUTCFullYear();
          const monthUTC = dateParam.getUTCMonth();
          const dateUTC = dateParam.getUTCDate();

          startOfDay = new Date(Date.UTC(yearUTC, monthUTC, dateUTC, 0, 0, 0, 0));
          endOfDay = new Date(Date.UTC(yearUTC, monthUTC, dateUTC, 23, 59, 59, 999));
        }
      } else {
        // Si NO se proporciona fecha, no usar new Date()
        // Retornar ventas vacías o usar una fecha default
        logger.warn('getDailySales llamado sin fecha - usando rango vacío');
        throw new AppError('Parámetro de fecha requerido', 400);
      }

      logger.debug(`getDailySales: rango de búsqueda UTC desde ${startOfDay} a ${endOfDay}`);

      // Obtener ventas completadas del día
      const sales = await prisma.sale.findMany({
        where: {
          status: SaleStatus.COMPLETED,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          user: {
            select: { id: true, username: true, fullName: true },
          },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      logger.debug(`getDailySales: encontradas ${sales.length} ventas`);

      // Calcular estadísticas
      const stats = this.calculateDailySalesStats(sales);

      return {
        sales: sales.map((sale) => this.formatSaleResponse(sale)),
        stats,
      };
    } catch (error) {
      logger.error('Error al obtener ventas diarias', error);
      throw new AppError('Error al obtener ventas diarias', 500);
    }
  }

  /**
   * Obtener solo estadísticas de ventas para un período
   */
  async getSalesStats(
    startDate?: Date,
    endDate?: Date,
    timezone: string = 'America/Mexico_City',
    branchId?: number
  ): Promise<DailySalesStats> {
    try {
      let start = startDate;
      let end = endDate;

      // Si no se especifican fechas, usar últimos 30 días
      if (!start || !end) {
        // Obtener "hoy" en la zona horaria del usuario
        const today = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          timeZone: timezone,
        });
        const todayString = formatter.format(today);
        const todayRange = convertLocalDateToUTCRange(todayString, timezone);

        end = todayRange.end;
        start = new Date(end);
        start.setUTCDate(start.getUTCDate() - 29); // Últimos 30 días
      }

      // Las fechas ya están correctamente en UTC
      const startUTC = new Date(start);
      const endUTC = new Date(end);

      const sales = await prisma.sale.findMany({
        where: {
          status: SaleStatus.COMPLETED,
          createdAt: {
            gte: startUTC,
            lte: endUTC,
          },
          ...(branchId ? { branchId } : {}),
        },
        include: {
          items: true,
        },
      });

      return this.calculateDailySalesStats(sales);
    } catch (error) {
      logger.error('Error al obtener estadísticas de ventas', error);
      throw new AppError('Error al obtener estadísticas de ventas', 500);
    }
  }

  /**
   * Obtener tendencia de ventas de la última semana (últimos 7 días)
   * O filtrado por rango de fechas
   */
  async getWeeklyTrend(
    startDate?: Date,
    endDate?: Date,
    timezone: string = 'America/Mexico_City',
    branchId?: number
  ): Promise<any[]> {
    try {
      let start: Date;
      let end: Date;

      if (startDate && endDate) {
        // Si se proporcionan fechas, usarlas directamente (ya están en UTC correctamente)
        start = startDate instanceof Date ? startDate : new Date(startDate);
        end = endDate instanceof Date ? endDate : new Date(endDate);
      } else {
        // Por defecto: últimos 7 días en la zona horaria del usuario
        // Obtener "hoy" en la zona horaria del usuario
        const today = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          timeZone: timezone,
        });
        const todayString = formatter.format(today);
        const todayRange = convertLocalDateToUTCRange(todayString, timezone);

        end = todayRange.end;
        start = new Date(end);
        start.setUTCDate(start.getUTCDate() - 6);
      }

      // Las fechas starte y end ya están correctamente en UTC
      const startUTC = new Date(start);
      const endUTC = new Date(end);

      const sales = await prisma.sale.findMany({
        where: {
          status: SaleStatus.COMPLETED,
          createdAt: {
            gte: startUTC,
            lte: endUTC,
          },
          ...(branchId ? { branchId } : {}),
        },
      });

      // Agrupar por día - usando la zona horaria del usuario
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const dailyData: Record<string, { ventas: number; transacciones: number }> = {};

      // Inicializar todos los días del rango
      const diffDays = Math.ceil((endUTC.getTime() - startUTC.getTime()) / (1000 * 60 * 60 * 24));
      for (let i = 0; i <= Math.min(diffDays, 6); i++) {
        const date = new Date(startUTC);
        date.setUTCDate(date.getUTCDate() + i);

        // Convertir a la zona horaria del usuario para obtener el día correcto
        const formatter = new Intl.DateTimeFormat('en-US', {
          weekday: 'short',
          timeZone: timezone,
        });

        const dayNameInEnglish = formatter.format(date);
        const dayName = translateDayNameToSpanish(dayNameInEnglish);

        if (!dailyData[dayName]) {
          dailyData[dayName] = { ventas: 0, transacciones: 0 };
        }
      }

      // Sumar ventas por día (según la zona horaria del usuario)
      for (const sale of sales) {
        const formatter = new Intl.DateTimeFormat('en-US', {
          weekday: 'short',
          timeZone: timezone,
        });

        const dayNameInEnglish = formatter.format(sale.createdAt);
        const dayName = translateDayNameToSpanish(dayNameInEnglish);

        if (dailyData[dayName]) {
          dailyData[dayName].ventas += Number(sale.total);
          dailyData[dayName].transacciones += 1;
        }
      }

      // Convertir a array en orden correcto (Lun-Dom)
      const orderedDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      return orderedDays.map((day) => ({
        day,
        ventas: Math.round(dailyData[day]?.ventas || 0),
        transacciones: dailyData[day]?.transacciones || 0,
      }));
    } catch (error) {
      logger.error('Error al obtener tendencia semanal', error);
      throw new AppError('Error al obtener tendencia semanal', 500);
    }
  }

  /**
   * Obtener comparación por semanas del mes actual
   * O filtrado por rango de fechas
   */
  async getMonthlyComparison(
    startDate?: Date,
    endDate?: Date,
    timezone: string = 'America/Mexico_City',
    branchId?: number
  ): Promise<any[]> {
    try {
      let start: Date;
      let end: Date;

      if (startDate && endDate) {
        // Si se proporcionan fechas, usarlas directamente (ya están en UTC correctamente)
        start = startDate instanceof Date ? startDate : new Date(startDate);
        end = endDate instanceof Date ? endDate : new Date(endDate);
      } else {
        // Por defecto: mes actual en la zona horaria del usuario
        const now = new Date();

        // Obtener el primer día del mes en la zona horaria del usuario
        const formatter = new Intl.DateTimeFormat('en-CA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          timeZone: timezone,
        });

        const todayString = formatter.format(now);
        const [year, month] = todayString.split('-').map(Number);

        const firstDayOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDayOfMonth = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

        const startRange = convertLocalDateToUTCRange(firstDayOfMonth, timezone);
        const endRange = convertLocalDateToUTCRange(lastDayOfMonth, timezone);

        start = startRange.start;
        end = endRange.end;
      }

      // Las fechas start y end ya están correctamente en UTC
      const startUTC = new Date(start);
      const endUTC = new Date(end);

      const sales = await prisma.sale.findMany({
        where: {
          status: SaleStatus.COMPLETED,
          createdAt: {
            gte: startUTC,
            lte: endUTC,
          },
          ...(branchId ? { branchId } : {}),
        },
      });

      // Agrupar por semana (semana 1-5) usando la zona horaria del usuario
      const weeklyData: Record<string, number> = {
        'Sem 1': 0,
        'Sem 2': 0,
        'Sem 3': 0,
        'Sem 4': 0,
        'Sem 5': 0,
      };

      for (const sale of sales) {
        // Convertir la fecha UTC a la zona horaria del usuario
        const formatter = new Intl.DateTimeFormat('en-CA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          timeZone: timezone,
        });

        const dateString = formatter.format(sale.createdAt);
        const day = parseInt(dateString.split('-')[2], 10);
        const weekNumber = Math.ceil(day / 7);
        const weekKey = `Sem ${weekNumber}`;

        if (weeklyData[weekKey] !== undefined) {
          weeklyData[weekKey] += Number(sale.total);
        }
      }

      return Object.entries(weeklyData).map(([periodo, ventas]) => ({
        periodo,
        ventas: Math.round(ventas),
      }));
    } catch (error) {
      logger.error('Error al obtener comparación mensual', error);
      throw new AppError('Error al obtener comparación mensual', 500);
    }
  }

  /**
   * Cancelar una venta y restaurar stock
   */
  async cancelSale(saleId: number, userId: number): Promise<SaleResponse> {
    try {
      const sale = await prisma.$transaction(async (tx) => {
        // Obtener venta con items
        const existingSale = await tx.sale.findUnique({
          where: { id: saleId },
          include: {
            items: true,
            user: { select: { id: true, username: true, fullName: true } },
          },
        });

        if (!existingSale) {
          throw new AppError('Venta no encontrada', 404);
        }

        if (existingSale.status !== SaleStatus.COMPLETED) {
          throw new AppError(`No se puede cancelar una venta con estado ${existingSale.status}`, 400);
        }

        // Actualizar estado a cancelada
        const updatedSale = await tx.sale.update({
          where: { id: saleId },
          data: { status: SaleStatus.CANCELLED },
          include: {
            user: { select: { id: true, username: true, fullName: true } },
            items: true,
          },
        });

        // Restaurar stock de cada producto
        for (const item of existingSale.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (product) {
            const previousStock = product.stock;

            // Incrementar stock
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
              },
            });

            // Crear movimiento de inventario
            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                userId,
                type: InventoryMovementType.AJUSTE,
                quantity: item.quantity,
                previousStock,
                newStock: previousStock + item.quantity,
                reason: `Cancelación de venta #${saleId}`,
                referenceId: saleId,
              },
            });
          }
        }

        return updatedSale;
      });

      logger.info(`Venta cancelada: ${saleId}`, { userId });
      return this.formatSaleResponse(sale);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al cancelar venta', error);
      throw new AppError('Error al cancelar venta', 500);
    }
  }

  /**
   * Helper: Formatear respuesta de venta
   */
  private formatSaleResponse(sale: any): SaleResponse {
    return {
      id: sale.id,
      userId: sale.userId,
      user: {
        id: sale.user.id,
        username: sale.user.username,
        fullName: sale.user.fullName,
      },
      items: sale.items.map((item: any) => ({
        id: item.id,
        saleId: item.saleId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        discount: item.discount ? Number(item.discount) : undefined,
      })),
      total: Number(sale.total),
      subtotal: Number(sale.subtotal),
      discount: Number(sale.discount),
      tax: Number(sale.tax),
      paymentMethod: sale.paymentMethod,
      amountReceived: sale.amountReceived ? Number(sale.amountReceived) : undefined,
      changeAmount: sale.changeAmount ? Number(sale.changeAmount) : undefined,
      status: sale.status,
      notes: sale.notes,
      source: sale.source,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
    };
  }

  /**
   * Helper: Calcular estadísticas diarias
   */
  private calculateDailySalesStats(sales: any[]): DailySalesStats {
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calcular por método de pago
    const effectivoSales = sales
      .filter((s) => s.paymentMethod === PaymentMethod.EFECTIVO)
      .reduce((sum, s) => sum + Number(s.total), 0);

    const tarjetaSales = sales
      .filter((s) => s.paymentMethod === PaymentMethod.TARJETA)
      .reduce((sum, s) => sum + Number(s.total), 0);

    const mixtoSales = sales
      .filter((s) => s.paymentMethod === PaymentMethod.MIXTO)
      .reduce((sum, s) => sum + Number(s.total), 0);

    // Top products
    const productMap = new Map<
      string,
      {
        productName: string;
        quantity: number;
        revenue: number;
      }
    >();

    for (const sale of sales) {
      for (const item of sale.items) {
        const existing = productMap.get(item.productId);
        const itemRevenue = Number(item.subtotal);

        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += itemRevenue;
        } else {
          productMap.set(item.productId, {
            productName: item.productName,
            quantity: item.quantity,
            revenue: itemRevenue,
          });
        }
      }
    }

    const topProducts = Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        ...data,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      totalSales,
      totalRevenue,
      averageTicket,
      effectivoSales,
      tarjetaSales,
      mixtoSales,
      topProducts,
    };
  }

  /**
   * Obtener corte de caja del día actual
   * Desglose por método de pago y totales
   */
  async getCashierCut(filters?: { userId?: number; branchId?: number }) {
    try {
      // Trabajar SIEMPRE en UTC
      const today = new Date();
      const yearUTC = today.getUTCFullYear();
      const monthUTC = today.getUTCMonth();
      const dateUTC = today.getUTCDate();

      const todayStart = new Date(Date.UTC(yearUTC, monthUTC, dateUTC, 0, 0, 0, 0));
      const todayEnd = new Date(Date.UTC(yearUTC, monthUTC, dateUTC, 23, 59, 59, 999));

      const whereClause: any = {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: 'COMPLETED',
      };

      // Si se proporciona userId, filtrar solo ese cajero
      if (filters?.userId) {
        whereClause.userId = filters.userId;
      }

      // Si se proporciona branchId, filtrar por sucursal
      if (filters?.branchId) {
        whereClause.branchId = filters.branchId;
      }

      // Obtener todas las ventas del día
      const sales = await prisma.sale.findMany({
        where: whereClause,
        select: {
          id: true,
          total: true,
          paymentMethod: true,
          createdAt: true,
          user: {
            select: {
              username: true,
            },
          },
        },
      });

      // Agrupar por método de pago
      const efectivoSales = sales.filter((s) => s.paymentMethod === 'EFECTIVO');
      const tarjetaSales = sales.filter((s) => s.paymentMethod === 'TARJETA');
      const mixtoSales = sales.filter((s) => s.paymentMethod === 'MIXTO');

      const efectivoTotal = efectivoSales.reduce((sum, s) => sum + Number(s.total), 0);
      const tarjetaTotal = tarjetaSales.reduce((sum, s) => sum + Number(s.total), 0);
      const mixtoTotal = mixtoSales.reduce((sum, s) => sum + Number(s.total), 0);

      const totalIngresos = efectivoTotal + tarjetaTotal + mixtoTotal;
      const totalTransactions = sales.length;

      // Primera y última venta del día
      const firstSale = sales.length > 0 ? sales[0].createdAt : null;
      const lastSale = sales.length > 0 ? sales[sales.length - 1].createdAt : null;

      return {
        date: today.toISOString(),
        cashier: filters?.userId ? sales[0]?.user?.username || 'N/A' : 'Todos',
        startTime: firstSale,
        endTime: lastSale,
        paymentMethods: {
          efectivo: {
            total: efectivoTotal,
            transactions: efectivoSales.length,
          },
          tarjeta: {
            total: tarjetaTotal,
            transactions: tarjetaSales.length,
          },
          mixto: {
            total: mixtoTotal,
            transactions: mixtoSales.length,
          },
        },
        summary: {
          fondoInicial: 1000, // Este debería venir de una tabla de configuración
          ingresosTurno: totalIngresos,
          egresos: 0, // Este debería venir de una tabla de egresos
          totalEnCaja: 1000 + totalIngresos,
        },
        totals: {
          totalIngresos,
          totalTransactions,
          averageTicket: totalTransactions > 0 ? totalIngresos / totalTransactions : 0,
        },
      };
    } catch (error) {
      logger.error('Error getting cashier cut:', error);
      throw error;
    }
  }
}

export const saleService = new SaleService();
