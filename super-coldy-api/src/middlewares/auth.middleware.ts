import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import prisma from '../config/database.js';

/**
 * Extender el tipo Request de Express para incluir la información del usuario autenticado
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware para autenticar token JWT
 * Extrae el token del header Authorization y verifica su validez
 * Si es válido, agrega la información del usuario a req.user
 *
 * @example
 * router.get('/profile', authenticateToken, handler);
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Obtener header Authorization
    const authHeader = req.headers.authorization;

    // Validar que el header exista y tenga formato "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Intento de acceso sin token', {
        ip: req.ip,
        path: req.path,
      });

      res.status(401).json({
        success: false,
        error: 'No autorizado - Token requerido',
      });
      return;
    }

    // Extraer token (quitar "Bearer ")
    const token = authHeader.substring(7);

    // Verificar y decodificar token
    const payload = verifyAccessToken(token);

    // Agregar información del usuario al request
    req.user = {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    };

    logger.debug('Token verificado exitosamente', {
      userId: payload.userId,
      role: payload.role,
    });

    next();
  } catch (error) {
    let errorMessage = 'Error de autenticación';

    if (error instanceof Error) {
      if (error.message === 'Token expirado') {
        errorMessage = 'No autorizado - Token expirado';
        logger.warn('Token expirado');
      } else if (error.message === 'Token inválido') {
        errorMessage = 'No autorizado - Token inválido';
        logger.warn('Token inválido');
      } else {
        errorMessage = `No autorizado - ${error.message}`;
        logger.error('Error en autenticación:', error);
      }
    }

    res.status(401).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Middleware para verificar que el usuario tiene uno de los roles permitidos
 * Debe usarse después de authenticateToken
 *
 * @param allowedRoles - Array de roles permitidos (ej: ['ADMIN', 'GERENTE'])
 * @returns Middleware que verifica el rol
 *
 * @example
 * router.delete('/users/:id', authenticateToken, requireRole('ADMIN'), deleteUser);
 * router.get('/reports', authenticateToken, requireRole('ADMIN', 'GERENTE'), getReports);
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Verificar que req.user exista (debe llamarse después de authenticateToken)
      if (!req.user) {
        logger.warn('Acceso a requireRole sin usuario autenticado', {
          ip: req.ip,
          path: req.path,
        });

        res.status(401).json({
          success: false,
          error: 'No autorizado - Usuario no autenticado',
        });
        return;
      }

      // Verificar que el rol del usuario esté en los roles permitidos
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Acceso denegado por permisos insuficientes', {
          userId: req.user.userId,
          userRole: req.user.role,
          allowedRoles,
          ip: req.ip,
          path: req.path,
        });

        res.status(403).json({
          success: false,
          error: 'Acceso denegado - Permisos insuficientes',
        });
        return;
      }

      logger.debug('Verificación de rol exitosa', {
        userId: req.user.userId,
        role: req.user.role,
      });

      next();
    } catch (error) {
      logger.error('Error verificando rol:', error);

      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  };
};

/**
 * Middleware para verificar que el usuario solo acceda a sus propios recursos
 * Debe usarse después de authenticateToken
 *
 * @example
 * router.get('/users/:userId/profile', authenticateToken, checkOwnership, getProfile);
 */
export const checkOwnership = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      logger.warn('Acceso a checkOwnership sin usuario autenticado');

      res.status(401).json({
        success: false,
        error: 'No autorizado - Usuario no autenticado',
      });
      return;
    }

    // Obtener userId del parámetro de la ruta
    const paramUserId = parseInt(Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId, 10);

    // Verificar que sea propietario del recurso o sea ADMIN
    if (req.user.userId !== paramUserId && req.user.role !== 'ADMIN') {
      logger.warn('Intento de acceso a recursos de otro usuario', {
        userId: req.user.userId,
        attemptedUserId: paramUserId,
        ip: req.ip,
        path: req.path,
      });

      res.status(403).json({
        success: false,
        error: 'Acceso denegado - Permisos insuficientes',
      });
      return;
    }

    logger.debug('Verificación de propiedad exitosa', {
      userId: req.user.userId,
      resourceUserId: paramUserId,
    });

    next();
  } catch (error) {
    logger.error('Error verificando propiedad:', error);

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

// Alias para compatibilidad
export const authMiddleware = authenticateToken;

/**
 * Middleware para verificar que el usuario tenga permiso sobre un módulo específico
 * Verifica tanto el rol (ADMIN siempre tiene acceso) como los permisos del módulo
 * Debe usarse después de authenticateToken
 *
 * @param moduleKey - Clave del módulo a verificar (ej: 'audit', 'pos', 'inventory')
 * @returns Middleware que verifica el permiso
 *
 * @example
 * router.get('/audit/logs', authenticateToken, requireModulePermission('audit'), getLogs);
 */
export const requireModulePermission = (moduleKey: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Verificar que req.user exista
      if (!req.user) {
        logger.warn('Acceso a requireModulePermission sin usuario autenticado', {
          ip: req.ip,
          path: req.path,
        });

        res.status(401).json({
          success: false,
          error: 'No autorizado - Usuario no autenticado',
        });
        return;
      }

      // Los ADMIN siempre tienen acceso a todo
      if (req.user.role === 'ADMIN') {
        logger.debug('Acceso concedido por rol ADMIN', {
          userId: req.user.userId,
          module: moduleKey,
        });
        next();
        return;
      }

      // Buscar el módulo
      const module = await prisma.module.findUnique({
        where: { key: moduleKey },
      });

      if (!module) {
        logger.error('Módulo no encontrado', { moduleKey });
        res.status(500).json({
          success: false,
          error: 'Error de configuración - Módulo no encontrado',
        });
        return;
      }

      // Verificar si el usuario tiene permiso para este módulo
      const permission = await prisma.permission.findUnique({
        where: {
          userId_moduleId: {
            userId: req.user.userId,
            moduleId: module.id,
          },
        },
      });

      if (!permission || !permission.granted) {
        logger.warn('Acceso denegado por falta de permisos de módulo', {
          userId: req.user.userId,
          module: moduleKey,
          ip: req.ip,
          path: req.path,
        });

        res.status(403).json({
          success: false,
          error: 'Acceso denegado - No tiene permisos para este módulo',
        });
        return;
      }

      logger.debug('Verificación de permiso de módulo exitosa', {
        userId: req.user.userId,
        module: moduleKey,
      });

      next();
    } catch (error) {
      logger.error('Error verificando permiso de módulo:', error);

      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  };
};
