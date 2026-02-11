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

class SaleService {
  /**
   * Crear una nueva venta
   * Valida productos, stock, calcula montos y registra la transacción
   */
  async createSale(data: CreateSaleInput, userId: number): Promise<SaleResponse> {
    try {
      // Validar que haya items
      if (!data.items || data.items.length === 0) {
        throw new AppError('La venta debe tener al menos un item', 400);
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

        // Crear la venta
        const newSale = await tx.sale.create({
          data: {
            userId,
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
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = endDate;
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
  async getDailySales(date?: Date): Promise<{ sales: SaleResponse[]; stats: DailySalesStats }> {
    try {
      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

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
  async getSalesStats(startDate?: Date, endDate?: Date): Promise<DailySalesStats> {
    try {
      let start = startDate;
      let end = endDate;

      // Si no se especifican fechas, usar últimos 30 días
      if (!start || !end) {
        end = new Date();
        start = new Date();
        start.setDate(start.getDate() - 30);
      }

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      const sales = await prisma.sale.findMany({
        where: {
          status: SaleStatus.COMPLETED,
          createdAt: {
            gte: start,
            lte: end,
          },
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
}

export const saleService = new SaleService();
