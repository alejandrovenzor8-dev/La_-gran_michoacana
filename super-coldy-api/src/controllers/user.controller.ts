import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';
import { logger } from '../utils/logger.js';
import { UserRole } from '@prisma/client';

interface CreateUserRequestBody {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role: UserRole;
}

interface UpdateUserRequestBody {
  username?: string;
  email?: string;
  fullName?: string;
  role?: UserRole;
  active?: boolean;
  timezone?: string;
  branchId?: number | null;
}

/**
 * Controlador de usuarios
 * Maneja las acciones relacionadas con la gestión de usuarios
 */
class UserController {
  /**
   * Obtener todos los usuarios con filtros y paginación
   * GET /api/users
   *
   * @query role - Filtrar por rol (ADMIN, CAJERO, GERENTE)
   * @query active - Filtrar por estado (true/false)
   * @query search - Buscar en username, email o fullName
   * @query page - Número de página (default: 1)
   * @query limit - Límite de resultados (default: 50)
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, active, search, page, limit } = req.query;

      const filters: any = {};

      if (role) {
        filters.role = (role as string).toUpperCase();
      }

      if (active !== undefined) {
        filters.active = active === 'true';
      }

      if (search) {
        filters.search = search as string;
      }

      if (page) {
        filters.page = parseInt(page as string);
      }

      if (limit) {
        filters.limit = parseInt(limit as string);
      }

      const result = await userService.getAllUsers(filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener usuario por ID
   * GET /api/users/:id
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = parseInt(id as string);

      const user = await userService.getUserById(userId);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crear nuevo usuario
   * POST /api/users
   *
   * @body username - Nombre de usuario único
   * @body email - Email único
   * @body password - Contraseña
   * @body fullName - Nombre completo (opcional)
   * @body role - Rol (ADMIN, CAJERO, GERENTE)
   */
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateUserRequestBody = req.body;

      // Validaciones básicas
      if (!data.username || !data.email || !data.password || !data.role) {
        res.status(400).json({
          success: false,
          message: 'Campos requeridos: username, email, password, role',
        });
        return;
      }

      const user = await userService.createUser(data);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar usuario
   * PUT /api/users/:id
   */
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = parseInt(id as string);
      const data: UpdateUserRequestBody = req.body;

      const user = await userService.updateUser(userId, data);

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Desactivar usuario (soft delete)
   * DELETE /api/users/:id
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = parseInt(id as string);

      const user = await userService.deactivateUser(userId);

      res.json({
        success: true,
        message: 'Usuario desactivado exitosamente',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activar usuario
   * PATCH /api/users/:id/activate
   */
  async activateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = parseInt(id as string);

      const user = await userService.activateUser(userId);

      res.json({
        success: true,
        message: 'Usuario activado exitosamente',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener estadísticas de usuarios
   * GET /api/users/stats/overview
   */
  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await userService.getUserStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
