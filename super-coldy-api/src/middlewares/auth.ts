import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

/**
 * Extender el tipo de Request para incluir el usuario autenticado
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware de autenticación
 * Verifica que el token JWT sea válido antes de permitir acceso a la ruta
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Token no encontrado en Authorization header');
      res.status(401).json({
        success: false,
        error: 'Token no proporcionado',
      });
      return;
    }

    // Extraer token sin "Bearer "
    const token = authHeader.substring(7);

    // Verificar token
    const payload = verifyAccessToken(token);

    // Adjuntar usuario al request
    req.user = payload;

    logger.debug('Usuario autenticado', { userId: payload.userId });
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error de autenticación';

    logger.warn('Error en autenticación:', { error: message });

    res.status(401).json({
      success: false,
      error: message,
    });
  }
};

/**
 * Middleware para verificar permisos de rol
 * Debe usarse después de authMiddleware
 * @param allowedRoles - Array de roles permitidos
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.warn('Usuario no autenticado en roleMiddleware');
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Acceso denegado por rol', {
        userId: req.user.userId,
        userRole: req.user.role,
        allowedRoles,
      });

      res.status(403).json({
        success: false,
        error: 'Permisos insuficientes para acceder a este recurso',
      });
      return;
    }

    logger.debug('Rol verificado', { role: req.user.role });
    next();
  };
};

/**
 * Middleware para comparar que el usuario solo pueda acceder a sus propios datos
 * Debe usarse después de authMiddleware
 */
export const ownershipMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    logger.warn('Usuario no autenticado en ownershipMiddleware');
    res.status(401).json({
      success: false,
      error: 'Usuario no autenticado',
    });
    return;
  }

  const userId = parseInt(Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId, 10);

  if (req.user.userId !== userId && req.user.role !== 'ADMIN') {
    logger.warn('Intento de acceso a recursos de otro usuario', {
      attemptedUserId: userId,
      actualUserId: req.user.userId,
    });

    res.status(403).json({
      success: false,
      error: 'No tienes permiso para acceder a los datos de otro usuario',
    });
    return;
  }

  logger.debug('Validación de propiedad exitosa');
  next();
};
