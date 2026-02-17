import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';
import { UserRole } from '@prisma/client';

/**
 * Controlador de usuarios
 * Maneja las operaciones CRUD de usuarios
 */
class UserController {
  /**
   * Obtener lista de todos los usuarios
   * GET /api/users
   * Requiere autenticación (admin)
   *
   * @query limit - Límite de resultados (default: 10)
   * @query offset - Offset para paginación (default: 0)
   */
  async getAllUsers(
    req: Request<{}, {}, {}, { limit?: string; offset?: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const limit = parseInt(req.query.limit || '10');
      const offset = parseInt(req.query.offset || '0');

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
      next(error);
    }
  }

  /**
   * Obtener usuario por ID
   * GET /api/users/:id
   * Requiere autenticación
   *
   * @param id - ID del usuario
   */
  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = parseInt(req.params.id as string);

      logger.debug('Obteniendo usuario por ID', { userId });

      const user = await authService.getUserById(userId);

      res.status(200).json({
        status: 'success',
        data: {
          user,
        },
      });
    } catch (error) {
      logger.error('Error obteniendo usuario:', error);
      next(error);
    }
  }

  /**
   * Actualizar usuario
   * PUT /api/users/:id
   * Requiere autenticación (admin o el mismo usuario)
   *
   * @param id - ID del usuario a actualizar
   * @body email, fullName, role, active
   */
  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = parseInt(req.params.id as string);
      const { email, fullName, role, active } = req.body;

      logger.info('Actualizando usuario', { userId, changedFields: Object.keys(req.body) });

      const updatedUser = await authService.updateUser(userId, {
        ...(email !== undefined && { email }),
        ...(fullName !== undefined && { fullName }),
        ...(role !== undefined && { role }),
        ...(active !== undefined && { active }),
      });

      res.status(200).json({
        status: 'success',
        message: 'Usuario actualizado exitosamente',
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      logger.error('Error actualizando usuario:', error);
      next(error);
    }
  }

  /**
   * Eliminar usuario
   * DELETE /api/users/:id
   * Requiere autenticación (admin)
   *
   * @param id - ID del usuario a eliminar
   */
  async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
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
      next(error);
    }
  }
}

// Exportar instancia singleton del controlador
export const userController = new UserController();
