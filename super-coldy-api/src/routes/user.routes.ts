import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { authService } from '../services/auth.service.js';
import { userService } from '../services/user.service.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// GET /api/users - Obtener todos los usuarios
router.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string || '10');
      const offset = parseInt(req.query.offset as string || '0');

      logger.debug('Obteniendo usuarios', { limit, offset });

      const { users, total } = await authService.getAllUsers(limit, offset);

      res.status(200).json({
        status: 'success',
        data: {
          users,
          pagination: {
            total,
            limit,
            offset,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      logger.error('Error obteniendo usuarios:', error);
      throw error;
    }
  })
);

// GET /api/users/stats - Obtener estadísticas de usuarios
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    try {
      logger.debug('Obteniendo estadísticas de usuarios');

      const stats = await authService.getUserStats();

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      logger.error('Error obteniendo estadísticas de usuarios:', error);
      throw error;
    }
  })
);

// GET /api/users/:id - Obtener usuario por ID
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    try {
      const userId = parseInt(req.params.id as string);
      logger.debug('Obteniendo usuario por ID', { userId });

      const user = await authService.getUserById(userId);

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      logger.error('Error obteniendo usuario:', error);
      throw error;
    }
  })
);

// PUT /api/users/:id - Actualizar usuario
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    try {
      const userId = parseInt(req.params.id as string);
      const { email, fullName, role, active, timezone, branchId } = req.body;

      logger.info('Actualizando usuario', { userId, branchId });

      const updatedUser = await userService.updateUser(userId, {
        email,
        fullName,
        role,
        active,
        timezone,
        branchId,
      });

      res.status(200).json({
        status: 'success',
        message: 'Usuario actualizado exitosamente',
        data: { user: updatedUser },
      });
    } catch (error) {
      logger.error('Error actualizando usuario:', error);
      throw error;
    }
  })
);

// DELETE /api/users/:id - Eliminar usuario
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    try {
      const userId = parseInt(req.params.id as string);
      logger.info('Eliminando usuario', { userId });

      await authService.deleteUser(userId);

      res.status(200).json({
        status: 'success',
        message: 'Usuario eliminado exitosamente',
      });
    } catch (error) {
      logger.error('Error eliminando usuario:', error);
      throw error;
    }
  })
);

export default router;
