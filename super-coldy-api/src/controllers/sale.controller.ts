/**
 * Controlador de Ventas
 * Maneja las peticiones HTTP del módulo de ventas
 */

import type { Request, Response, NextFunction } from 'express';
import { saleService } from '../services/sale.service.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logger } from '../utils/logger.js';
import type { CreateSaleInput, SaleFilters } from '../types/sale.types.js';

class SaleController {
  /**
   * POST /api/sales
   * Crear una nueva venta
   * @access Private (CAJERO, GERENTE, ADMIN)
   * @body CreateSaleInput
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        throw new AppError('Usuario no autenticado', 401);
      }

      const { items, paymentMethod, amountReceived, discount, tax, notes, source } = req.body;

      // Validar que items no esté vacío
      if (!items || items.length === 0) {
        throw new AppError('La venta debe tener al menos un item', 400);
      }

      const data: CreateSaleInput = {
        items,
        paymentMethod,
        amountReceived,
        discount,
        tax,
        notes,
        source,
      };

      const sale = await saleService.createSale(data, userId);

      res.status(201).json({
        success: true,
        message: 'Venta creada exitosamente',
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sales
   * Obtener todas las ventas con filtros y paginación
   * @access Private (GERENTE, ADMIN)
   * @query startDate, endDate, userId, paymentMethod, status, source, page, limit
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, userId, paymentMethod, status, source, page, limit } =
        req.query;

      const filters: SaleFilters = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 50,
      };

      if (startDate) {
        filters.startDate = new Date(String(startDate));
      }

      if (endDate) {
        filters.endDate = new Date(String(endDate));
      }

      if (userId) {
        filters.userId = String(userId);
      }

      if (paymentMethod) {
        filters.paymentMethod = String(paymentMethod) as 'EFECTIVO' | 'TARJETA' | 'MIXTO';
      }

      if (status) {
        filters.status = String(status) as 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
      }

      if (source) {
        filters.source = String(source) as 'DESKTOP' | 'MOBILE';
      }

      const result = await saleService.getAllSales(filters);

      res.status(200).json({
        success: true,
        data: {
          sales: result.sales,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sales/:id
   * Obtener una venta por ID
   * @access Private (CAJERO, GERENTE, ADMIN)
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let { id } = req.params;

      // Normalizar si es array
      if (Array.isArray(id)) {
        id = id[0];
      }

      const saleId = parseInt(id, 10);
      if (isNaN(saleId)) {
        throw new AppError('ID de venta inválido', 400);
      }

      const sale = await saleService.getSaleById(saleId);

      res.status(200).json({
        success: true,
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sales/daily
   * Obtener reporte de ventas del día
   * @access Private (GERENTE, ADMIN)
   * @query date (opcional, formato YYYY-MM-DD)
   */
  async getDailyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = req.query;

      let targetDate: Date | undefined;
      if (date) {
        targetDate = new Date(String(date));
        if (isNaN(targetDate.getTime())) {
          throw new AppError('Formato de fecha inválido. Use YYYY-MM-DD', 400);
        }
      }

      const result = await saleService.getDailySales(targetDate);

      res.status(200).json({
        success: true,
        data: {
          sales: result.sales,
          stats: result.stats,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sales/stats/daily
   * Obtener solo las estadísticas de ventas del día
   * @access Private (CAJERO, GERENTE, ADMIN)
   * @query date (opcional, formato YYYY-MM-DD)
   */
  async getDailyStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = req.query;

      let targetDate: Date | undefined;
      if (date) {
        targetDate = new Date(String(date));
        if (isNaN(targetDate.getTime())) {
          throw new AppError('Formato de fecha inválido. Use YYYY-MM-DD', 400);
        }
      }

      const result = await saleService.getDailySales(targetDate);

      res.status(200).json({
        success: true,
        data: result.stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sales/stats
   * Obtener estadísticas de ventas
   * @access Private (GERENTE, ADMIN)
   * @query startDate, endDate (opcionales)
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      let start: Date | undefined;
      let end: Date | undefined;

      if (startDate) {
        start = new Date(String(startDate));
        if (isNaN(start.getTime())) {
          throw new AppError('Fecha de inicio inválida', 400);
        }
      }

      if (endDate) {
        end = new Date(String(endDate));
        if (isNaN(end.getTime())) {
          throw new AppError('Fecha de fin inválida', 400);
        }
      }

      const stats = await saleService.getSalesStats(start, end);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sales/weekly-trend
   * Obtener tendencia de ventas de la última semana
   * @access Private (GERENTE, ADMIN)
   * @query startDate, endDate (opcionales)
   */
  async getWeeklyTrend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      let start: Date | undefined;
      let end: Date | undefined;

      if (startDate) {
        start = new Date(String(startDate));
        if (isNaN(start.getTime())) {
          throw new AppError('Fecha de inicio inválida', 400);
        }
      }

      if (endDate) {
        end = new Date(String(endDate));
        if (isNaN(end.getTime())) {
          throw new AppError('Fecha de fin inválida', 400);
        }
      }

      const trend = await saleService.getWeeklyTrend(start, end);

      res.status(200).json({
        success: true,
        data: trend,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sales/monthly-comparison
   * Obtener comparación por semanas del mes actual
   * @access Private (GERENTE, ADMIN)
   * @query startDate, endDate (opcionales)
   */
  async getMonthlyComparison(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      let start: Date | undefined;
      let end: Date | undefined;

      if (startDate) {
        start = new Date(String(startDate));
        if (isNaN(start.getTime())) {
          throw new AppError('Fecha de inicio inválida', 400);
        }
      }

      if (endDate) {
        end = new Date(String(endDate));
        if (isNaN(end.getTime())) {
          throw new AppError('Fecha de fin inválida', 400);
        }
      }

      const comparison = await saleService.getMonthlyComparison(start, end);

      res.status(200).json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/sales/:id/cancel
   * Cancelar una venta y restaurar stock
   * @access Private (GERENTE, ADMIN)
   */
  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        throw new AppError('Usuario no autenticado', 401);
      }

      let { id } = req.params;

      // Normalizar si es array
      if (Array.isArray(id)) {
        id = id[0];
      }

      const saleId = parseInt(id, 10);
      if (isNaN(saleId)) {
        throw new AppError('ID de venta inválido', 400);
      }

      const sale = await saleService.cancelSale(saleId, userId);

      res.status(200).json({
        success: true,
        message: 'Venta cancelada exitosamente',
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sales/cashier-cut
   * Obtener corte de caja del día actual
   * @access Private (CAJERO, GERENTE, ADMIN)
   * @query userId (opcional) - filtrar por cajero específico
   */
  async getCashierCut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      const cashierCut = await saleService.getCashierCut(userId);

      res.status(200).json({
        success: true,
        data: cashierCut,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const saleController = new SaleController();
