import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Controlador de permisos y módulos
 * Maneja las operaciones de permisos de usuarios y módulos del sistema
 */
class PermissionController {
  /**
   * Obtener todos los módulos disponibles
   * GET /api/modules
   */
  async getAllModules(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      logger.debug('Obteniendo todos los módulos');

      const modules = await prisma.module.findMany({
        where: { active: true },
        orderBy: { key: 'asc' },
      });

      res.status(200).json({
        status: 'success',
        data: {
          modules,
        },
      });
    } catch (error) {
      logger.error('Error obteniendo módulos:', error);
      next(error);
    }
  }

  /**
   * Obtener permisos de un usuario específico
   * GET /api/permissions/user/:userId
   * 
   * @param userId - ID del usuario
   */
  async getUserPermissions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = parseInt(req.params.userId as string);
      logger.debug('Obteniendo permisos de usuario', { userId });

      const permissions = await prisma.permission.findMany({
        where: { userId },
        include: {
          module: true,
        },
      });

      // Transformar a formato { moduleKey: granted }
      const permissionsMap: Record<string, boolean> = {};
      permissions.forEach((perm: any) => {
        permissionsMap[perm.module.key] = perm.granted;
      });

      res.status(200).json({
        status: 'success',
        data: {
          userId,
          permissions: permissionsMap,
        },
      });
    } catch (error) {
      logger.error('Error obteniendo permisos de usuario:', error);
      next(error);
    }
  }

  /**
   * Obtener permisos de un usuario por username
   * GET /api/permissions/username/:username
   * 
   * @param username - Username del usuario
   */
  async getUserPermissionsByUsername(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const username = req.params.username as string;
      logger.debug('Obteniendo permisos de usuario por username', { username });

      const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'Usuario no encontrado',
        });
        return;
      }

      const permissions = await prisma.permission.findMany({
        where: { userId: user.id },
        include: {
          module: true,
        },
      });

      // Transformar a formato { moduleKey: granted }
      const permissionsMap: Record<string, boolean> = {};
      permissions.forEach((perm: any) => {
        permissionsMap[perm.module.key] = perm.granted;
      });

      res.status(200).json({
        status: 'success',
        data: {
          username,
          permissions: permissionsMap,
        },
      });
    } catch (error) {
      logger.error('Error obteniendo permisos de usuario por username:', error);
      next(error);
    }
  }

  /**
   * Actualizar permisos de un usuario
   * PUT /api/permissions/user/:userId
   * Requiere autenticación (admin)
   * 
   * @param userId - ID del usuario
   * @body permissions - Objeto con { moduleKey: boolean }
   */
  async updateUserPermissions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = parseInt(req.params.userId as string);
      const { permissions } = req.body as { permissions: Record<string, boolean> };

      logger.debug('Actualizando permisos de usuario', { userId, permissions });

      // Validar que el usuario exista
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'Usuario no encontrado',
        });
        return;
      }

      // Obtener todos los módulos
      const modules = await prisma.module.findMany({
        where: { active: true },
      });

      // Procesar cada permiso
      const results = [];
      for (const module of modules) {
        const granted = permissions[module.key] ?? false;

        // Buscar si ya existe el permiso
        const existingPermission = await prisma.permission.findUnique({
          where: {
            userId_moduleId: {
              userId,
              moduleId: module.id,
            },
          },
        });

        if (existingPermission) {
          // Actualizar permiso existente
          const updated = await prisma.permission.update({
            where: {
              userId_moduleId: {
                userId,
                moduleId: module.id,
              },
            },
            data: {
              granted,
            },
          });
          results.push(updated);
        } else {
          // Crear nuevo permiso
          const created = await prisma.permission.create({
            data: {
              userId,
              moduleId: module.id,
              granted,
            },
          });
          results.push(created);
        }
      }

      res.status(200).json({
        status: 'success',
        message: 'Permisos actualizados correctamente',
        data: {
          userId,
          permissionsUpdated: results.length,
        },
      });
    } catch (error) {
      logger.error('Error actualizando permisos de usuario:', error);
      next(error);
    }
  }

  /**
   * Actualizar permisos de un usuario por username
   * PUT /api/permissions/username/:username
   * Requiere autenticación (admin)
   * 
   * @param username - Username del usuario
   * @body permissions - Objeto con { moduleKey: boolean }
   */
  async updateUserPermissionsByUsername(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const username = req.params.username as string;
      const { permissions } = req.body as { permissions: Record<string, boolean> };

      logger.debug('Actualizando permisos de usuario por username', { username, permissions });

      // Validar que el usuario exista
      const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'Usuario no encontrado',
        });
        return;
      }

      // Obtener todos los módulos
      const modules = await prisma.module.findMany({
        where: { active: true },
      });

      // Procesar cada permiso
      const results = [];
      for (const module of modules) {
        const granted = permissions[module.key] ?? false;

        // Buscar si ya existe el permiso
        const existingPermission = await prisma.permission.findUnique({
          where: {
            userId_moduleId: {
              userId: user.id,
              moduleId: module.id,
            },
          },
        });

        if (existingPermission) {
          // Actualizar permiso existente
          const updated = await prisma.permission.update({
            where: {
              userId_moduleId: {
                userId: user.id,
                moduleId: module.id,
              },
            },
            data: {
              granted,
            },
          });
          results.push(updated);
        } else {
          // Crear nuevo permiso
          const created = await prisma.permission.create({
            data: {
              userId: user.id,
              moduleId: module.id,
              granted,
            },
          });
          results.push(created);
        }
      }

      res.status(200).json({
        status: 'success',
        message: 'Permisos actualizados correctamente',
        data: {
          username,
          permissionsUpdated: results.length,
        },
      });
    } catch (error) {
      logger.error('Error actualizando permisos de usuario por username:', error);
      next(error);
    }
  }
}

export const permissionController = new PermissionController();
