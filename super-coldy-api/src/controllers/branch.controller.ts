import { Request, Response, NextFunction } from 'express';
import { branchService } from '../services/branch.service.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { getRequestInfo } from '../utils/auditLogger.js';
import prisma from '../config/database.js';

/**
 * Interface extendida de Request con usuario autenticado
 */
interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
    role: string;
  };
}

/**
 * Controlador de Sucursales
 * Maneja todas las operaciones CRUD de sucursales
 */
class BranchController {
  /**
   * Crear una nueva sucursal
   * POST /api/branches
   */
  async createBranch(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      logger.info('Creando nueva sucursal');

      const { ipAddress, userAgent } = getRequestInfo(req);
      const branch = await branchService.createBranch({
        ...req.body,
        userId: req.user?.userId,
        ipAddress,
        userAgent,
      });

      res.status(201).json({
        status: 'success',
        message: 'Sucursal creada exitosamente',
        data: { branch },
      });
    } catch (error) {
      logger.error('Error creando sucursal:', error);
      next(error);
    }
  }

  /**
   * Obtener todas las sucursales
   * GET /api/branches
   * Query parameters: active
   */
  async getAllBranches(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const activeParam = req.query.active;
      const active = activeParam === 'true' ? true : activeParam === 'false' ? false : undefined;

      logger.debug('Obteniendo sucursales', { active });

      const branches = await branchService.getAllBranches({ active });

      res.status(200).json({
        status: 'success',
        data: { branches },
      });
    } catch (error) {
      logger.error('Error obteniendo sucursales:', error);
      next(error);
    }
  }

  /**
   * Obtener una sucursal por ID
   * GET /api/branches/:id
   */
  async getBranchById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      logger.debug('Obteniendo sucursal por ID:', id);

      const branch = await branchService.getBranchById(id);

      res.status(200).json({
        status: 'success',
        data: { branch },
      });
    } catch (error) {
      logger.error('Error obteniendo sucursal:', error);
      next(error);
    }
  }

  /**
   * Actualizar una sucursal
   * PUT /api/branches/:id
   */
  async updateBranch(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      logger.info('Actualizando sucursal:', id);

      const { ipAddress, userAgent } = getRequestInfo(req);
      const branch = await branchService.updateBranch(id, {
        ...req.body,
        userId: req.user?.userId,
        ipAddress,
        userAgent,
      });

      res.status(200).json({
        status: 'success',
        message: 'Sucursal actualizada exitosamente',
        data: { branch },
      });
    } catch (error) {
      logger.error('Error actualizando sucursal:', error);
      next(error);
    }
  }

  /**
   * Activar/Desactivar una sucursal
   * PATCH /api/branches/:id/status
   */
  async toggleBranchStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { active } = req.body;
      logger.info('Cambiando estado de sucursal:', { id, active });

      const branch = await branchService.toggleBranchStatus(id, active);

      res.status(200).json({
        status: 'success',
        message: `Sucursal ${active ? 'activada' : 'desactivada'} exitosamente`,
        data: { branch },
      });
    } catch (error) {
      logger.error('Error cambiando estado de sucursal:', error);
      next(error);
    }
  }

  /**
   * Eliminar una sucursal
   * DELETE /api/branches/:id
   */
  async deleteBranch(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      logger.info('Eliminando sucursal:', id);

      const { ipAddress, userAgent } = getRequestInfo(req);
      await branchService.deleteBranch(
        id,
        req.user?.userId,
        ipAddress,
        userAgent
      );

      res.status(200).json({
        status: 'success',
        message: 'Sucursal eliminada exitosamente',
      });
    } catch (error) {
      logger.error('Error eliminando sucursal:', error);
      next(error);
    }
  }

  /**
   * Actualizar caja inicial de una sucursal
   * PATCH /api/branches/:id/initial-cash
   */
  async updateInitialCash(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { initialCash } = req.body;
      logger.info('Actualizando caja inicial de sucursal:', { id, initialCash });

      if (typeof initialCash !== 'number' || initialCash < 0) {
        res.status(400).json({
          status: 'error',
          message: 'El monto de caja inicial debe ser un número positivo',
        });
        return;
      }

      // Seguridad: usuarios que no son admin solo pueden actualizar su propia sucursal.
      if (req.user?.role !== 'ADMIN') {
        const requester = await prisma.user.findUnique({
          where: { id: req.user!.userId },
          select: { branchId: true },
        });

        if (!requester?.branchId) {
          res.status(400).json({
            status: 'error',
            message: 'El usuario no tiene una sucursal asignada',
          });
          return;
        }

        if (requester.branchId !== id) {
          res.status(403).json({
            status: 'error',
            message: 'No tienes permisos para actualizar otra sucursal',
          });
          return;
        }
      }

      const { ipAddress, userAgent } = getRequestInfo(req);
      const branch = await branchService.updateInitialCash(
        id,
        initialCash,
        req.user?.userId,
        ipAddress,
        userAgent
      );

      res.status(200).json({
        status: 'success',
        message: 'Caja inicial actualizada exitosamente',
        data: { branch },
      });
    } catch (error) {
      logger.error('Error actualizando caja inicial:', error);
      next(error);
    }
  }
}

// Exportar instancia única del controlador
export const branchController = new BranchController();
