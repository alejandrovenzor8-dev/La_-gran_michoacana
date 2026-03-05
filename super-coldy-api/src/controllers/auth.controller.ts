import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';
import { UserRole } from '@prisma/client';

/**
 * Interface para datos de registro en el body
 */
interface RegisterRequestBody {
  username: string;
  email: string;
  password: string;
  fullName?: string | undefined;
  role?: UserRole;
  branchId?: number;
}

/**
 * Interface para datos de login en el body
 */
interface LoginRequestBody {
  username: string;
  password: string;
}

/**
 * Interface para refresh token en el body
 */
interface RefreshTokenRequestBody {
  refreshToken: string;
}

/**
 * Controlador de autenticación
 * Maneja las acciones relacionadas con login, registro y tokens
 */
class AuthController {
  /**
   * Registrar un nuevo usuario
   * POST /api/auth/register
   *
   * @example
   * POST /api/auth/register
   * {
   *   "username": "juan",
   *   "email": "juan@example.com",
   *   "password": "MiPassword123!",
   *   "fullName": "Juan García"
   * }
   */
  async register(
    req: Request<{}, {}, RegisterRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { username, email, password, fullName, role, branchId } = req.body;

      logger.info('Iniciando registro de usuario', { username, email, branchId });

      // Llamar al servicio de autenticación
      const user = await authService.register({
        username,
        email,
        password,
        fullName,
        role,
        branchId,
      });

      // Generar tokens para el nuevo usuario
      const { generateAccessToken, generateRefreshToken } = await import(
        '../utils/jwt.js'
      );
      const accessToken = generateAccessToken(user.id, user.username, user.role);
      const refreshToken = generateRefreshToken(user.id);

      logger.info('Usuario registrado y autenticado', { userId: user.id });

      res.status(201).json({
        status: 'success',
        message: 'Usuario registrado exitosamente',
        data: {
          user,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      logger.error('Error en registro:', error);
      next(error);
    }
  }

  /**
   * Login de usuario
   * POST /api/auth/login
   *
   * @example
   * POST /api/auth/login
   * {
   *   "username": "juan@example.com",
   *   "password": "MiPassword123!"
   * }
   */
  async login(
    req: Request<{}, {}, LoginRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { username, password } = req.body;

      logger.info('Iniciando login', { username });

      // Llamar al servicio de autenticación
      const { user, accessToken, refreshToken } = await authService.login(
        username,
        password
      );

      logger.info('Login exitoso', { userId: user.id });

      res.status(200).json({
        status: 'success',
        message: 'Login exitoso',
        data: {
          user,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      logger.error('Error en login:', error);
      next(error);
    }
  }

  /**
   * Refrescar token de acceso
   * POST /api/auth/refresh-token
   *
   * @example
   * POST /api/auth/refresh-token
   * {
   *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   */
  async refreshToken(
    req: Request<{}, {}, RefreshTokenRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;

      logger.debug('Iniciando refresh de token');

      // Validar que refresh token esté presente
      if (!refreshToken) {
        res.status(400).json({
          status: 'error',
          message: 'Refresh token requerido',
        });
        return;
      }

      // Llamar al servicio de autenticación
      const { accessToken } = await authService.refreshAccessToken(refreshToken);

      logger.debug('Token refrescado exitosamente');

      res.status(200).json({
        status: 'success',
        message: 'Token refrescado exitosamente',
        data: {
          accessToken,
        },
      });
    } catch (error) {
      logger.error('Error refrescando token:', error);
      next(error);
    }
  }

  /**
   * Obtener usuario actual
   * GET /api/auth/me
   * Requiere autenticación (token en Authorization header)
   *
   * @example
   * GET /api/auth/me
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   */
  async getCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'Usuario no autenticado',
        });
        return;
      }

      logger.debug('Obteniendo usuario actual', { userId: req.user.userId });

      // Llamar al servicio para obtener datos actualizados del usuario
      const user = await authService.getUserById(req.user.userId);

      logger.debug('Usuario obtenido exitosamente', { userId: user.id });

      res.status(200).json({
        status: 'success',
        data: {
          user,
        },
      });
    } catch (error) {
      logger.error('Error obteniendo usuario actual:', error);
      next(error);
    }
  }

  /**
   * Cambiar contraseña del usuario actual
   * POST /api/auth/change-password
   * Requiere autenticación
   *
   * @example
   * POST /api/auth/change-password
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * {
   *   "currentPassword": "MiPasswordActual123!",
   *   "newPassword": "MiNuevaPassword123!"
   * }
   */
  async changePassword(
    req: Request<
      {},
      {},
      {
        currentPassword: string;
        newPassword: string;
      }
    >,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'Usuario no autenticado',
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      logger.info('Iniciando cambio de contraseña', { userId: req.user.userId });

      // Llamar al servicio de autenticación
      await authService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword
      );

      logger.info('Contraseña cambiada exitosamente', { userId: req.user.userId });

      res.status(200).json({
        status: 'success',
        message: 'Contraseña cambiada exitosamente',
      });
    } catch (error) {
      logger.error('Error cambiando contraseña:', error);
      next(error);
    }
  }

  /**
   * Logout (limpieza en frontend)
   * POST /api/auth/logout
   * Requiere autenticación
   *
   * @note En este caso es principalmente una confirmación en el servidor
   * El frontend es responsable de eliminar los tokens
   */
  async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'Usuario no autenticado',
        });
        return;
      }

      logger.info('Usuario logout', { userId: req.user.userId });

      res.status(200).json({
        status: 'success',
        message: 'Logout exitoso',
      });
    } catch (error) {
      logger.error('Error en logout:', error);
      next(error);
    }
  }

  /**
   * Verificar que el token sea válido
   * GET /api/auth/verify
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   */
  async verifyToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'Token inválido o expirado',
        });
        return;
      }

      logger.debug('Verificando token', { userId: req.user.userId });

      res.status(200).json({
        status: 'success',
        message: 'Token válido',
        data: {
          userId: req.user.userId,
          role: req.user.role,
        },
      });
    } catch (error) {
      logger.error('Error verificando token:', error);
      next(error);
    }
  }
}

// Exportar instancia singleton del controlador
export const authController = new AuthController();
