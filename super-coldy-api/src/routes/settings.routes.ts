import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import prisma from '../config/database.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

/**
 * PUT /api/settings/timezone
 * Actualiza la zona horaria para TODOS los usuarios del sistema
 * Solo accesible por administradores
 */
router.put(
  '/timezone',
  asyncHandler(async (req, res) => {
    try {
      // Verificar que el usuario es admin
      if (req.user?.role !== 'admin') {
        throw new AppError('Solo los administradores pueden cambiar la configuración global', 403);
      }

      const { timezone } = req.body;

      if (!timezone) {
        throw new AppError('La zona horaria es requerida', 400);
      }

      logger.info('Actualizando zona horaria global', { 
        adminId: req.user?.userId, 
        timezone 
      });

      // Actualizar TODOS los usuarios con la nueva zona horaria
      const result = await prisma.user.updateMany({
        data: {
          timezone,
        },
      });

      logger.info('Zona horaria actualizada para todos los usuarios', { 
        usersUpdated: result.count,
        timezone 
      });

      res.status(200).json({
        status: 'success',
        message: `Zona horaria actualizada para ${result.count} usuarios`,
        data: { 
          timezone,
          usersUpdated: result.count 
        },
      });
    } catch (error) {
      logger.error('Error actualizando zona horaria global:', error);
      throw error;
    }
  })
);

export default router;
