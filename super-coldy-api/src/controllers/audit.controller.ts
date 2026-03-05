import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { getAuditLogs, AuditAction } from '../utils/auditLogger.js';

/**
 * Controlador de Auditoría
 * Maneja las consultas del historial de cambios
 */
class AuditController {
  /**
   * Obtener logs de auditoría con filtros
   * GET /api/audit/logs
   */
  async getAuditLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        userId,
        branchId,
        entity,
        action,
        startDate,
        endDate,
        limit,
        offset,
      } = req.query;

      logger.debug('Obteniendo logs de auditoría', req.query);

      const filters: any = {};

      if (userId) filters.userId = parseInt(String(userId), 10);
      if (branchId) filters.branchId = parseInt(String(branchId), 10);
      if (entity) filters.entity = String(entity);
      if (action) filters.action = action as AuditAction;
      if (startDate) filters.startDate = new Date(String(startDate));
      if (endDate) filters.endDate = new Date(String(endDate));
      if (limit) filters.limit = parseInt(String(limit), 10);
      if (offset) filters.offset = parseInt(String(offset), 10);

      const result = await getAuditLogs(filters);

      res.status(200).json({
        status: 'success',
        data: {
          logs: result.logs,
          total: result.total,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
        },
      });
    } catch (error) {
      logger.error('Error obteniendo logs de auditoría:', error);
      next(error);
    }
  }

  /**
   * Obtener logs de auditoría de una sucursal específica
   * GET /api/audit/branches/:branchId
   */
  async getBranchAuditLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const branchId = parseInt(String(req.params.branchId), 10);
      const { limit, offset, startDate, endDate } = req.query;

      logger.debug('Obteniendo logs de auditoría de sucursal:', branchId);

      const filters: any = {
        branchId,
        entity: 'Branch',
      };

      if (startDate) filters.startDate = new Date(String(startDate));
      if (endDate) filters.endDate = new Date(String(endDate));
      if (limit) filters.limit = parseInt(String(limit), 10);
      if (offset) filters.offset = parseInt(String(offset), 10);

      const result = await getAuditLogs(filters);

      res.status(200).json({
        status: 'success',
        data: {
          logs: result.logs,
          total: result.total,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
        },
      });
    } catch (error) {
      logger.error('Error obteniendo logs de auditoría de sucursal:', error);
      next(error);
    }
  }

  /**
   * Obtener logs de auditoría de un usuario específico
   * GET /api/audit/users/:userId
   */
  async getUserAuditLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = parseInt(String(req.params.userId), 10);
      const { limit, offset, startDate, endDate } = req.query;

      logger.debug('Obteniendo logs de auditoría de usuario:', userId);

      const filters: any = {
        userId,
      };

      if (startDate) filters.startDate = new Date(String(startDate));
      if (endDate) filters.endDate = new Date(String(endDate));
      if (limit) filters.limit = parseInt(String(limit), 10);
      if (offset) filters.offset = parseInt(String(offset), 10);

      const result = await getAuditLogs(filters);

      res.status(200).json({
        status: 'success',
        data: {
          logs: result.logs,
          total: result.total,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
        },
      });
    } catch (error) {
      logger.error('Error obteniendo logs de auditoría de usuario:', error);
      next(error);
    }
  }
}

// Exportar instancia única del controlador
export const auditController = new AuditController();
