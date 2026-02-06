import prisma from '../config/database';
import { AppError, asyncHandler } from '../middlewares/errorHandler';
import { hashPassword, comparePassword } from '../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { logger } from '../utils/logger';
import { User, UserRole } from '@prisma/client';

/**
 * Interface para datos de registro
 */
interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role?: UserRole;
}

/**
 * Interface para respuesta de login
 */
interface LoginResponse {
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string | null;
    role: string; // Convertido a minúsculas
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Interface para respuesta de refresh token
 */
interface RefreshTokenResponse {
  accessToken: string;
}

/**
 * Interface para usuario sin contraseña
 */
interface UserWithoutPassword extends Omit<User, 'passwordHash'> {}

/**
 * Servicio de autenticación
 * Maneja registro, login, refresh token y obtención de usuarios
 */
class AuthService {
  /**
   * Registrar un nuevo usuario
   * @param data - Datos del usuario a registrar
   * @returns Usuario creado sin contraseña
   * @throws AppError si usuario o email ya existen
   */
  async register(data: RegisterData): Promise<UserWithoutPassword> {
    try {
      const { username, email, password, fullName, role = 'CAJERO' } = data;

      // Validar que username no exista
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUsername) {
        logger.warn('Intento de registro con username existente', { username });
        throw new AppError('El usuario ya existe', 409);
      }

      // Validar que email no exista
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        logger.warn('Intento de registro con email existente', { email });
        throw new AppError('El email ya está registrado', 409);
      }

      // Hashear contraseña
      const passwordHash = await hashPassword(password);

      // Crear usuario
      const user = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          fullName: fullName || null,
          role,
          active: true,
        },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('Usuario registrado exitosamente', { username, email });

      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error en registro:', error);
      throw error;
    }
  }

  /**
   * Login de usuario
   * @param usernameOrEmail - Username o email del usuario
   * @param password - Contraseña del usuario
   * @returns Datos del usuario, access token y refresh token
   * @throws AppError si credenciales son inválidas o usuario está inactivo
   */
  async login(usernameOrEmail: string, password: string): Promise<LoginResponse> {
    try {
      // Buscar usuario por username o email
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
        },
      });

      // Si no existe, lanzar error
      if (!user) {
        logger.warn('Intento de login con credenciales inválidas', {
          usernameOrEmail,
        });
        throw new AppError('Credenciales inválidas', 401);
      }

      // Verificar que el usuario esté activo
      if (!user.active) {
        logger.warn('Intento de login con usuario inactivo', { userId: user.id });
        throw new AppError('Usuario desactivado', 403);
      }

      // Verificar contraseña
      const isPasswordValid = await comparePassword(password, user.passwordHash);

      if (!isPasswordValid) {
        logger.warn('Intento de login con contraseña incorrecta', {
          userId: user.id,
        });
        throw new AppError('Credenciales inválidas', 401);
      }

      // Generar tokens
      const accessToken = generateAccessToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id);

      logger.info('Usuario logueado exitosamente', {
        userId: user.id,
        username: user.username,
      });

      // Retornar datos sin contraseña y con rol en minúsculas
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role.toLowerCase(), // Convertir a minúsculas
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error en login:', error);
      throw error;
    }
  }

  /**
   * Refrescar token de acceso
   * @param refreshToken - Refresh token válido
   * @returns Nuevo access token
   * @throws AppError si refresh token es inválido o usuario no existe
   */
  async refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      // Verificar refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Buscar usuario
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      // Validar que usuario exista y esté activo
      if (!user || !user.active) {
        logger.warn('Intento de refresh con usuario inválido o inactivo', {
          userId: payload.userId,
        });
        throw new AppError('Usuario no encontrado o inactivo', 401);
      }

      // Generar nuevo access token
      const accessToken = generateAccessToken(user.id, user.role);

      logger.info('Token refrescado exitosamente', { userId: user.id });

      return { accessToken };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error refrescando token:', error);
      throw error;
    }
  }

  /**
   * Obtener usuario por ID
   * @param userId - ID del usuario
   * @returns Datos del usuario sin contraseña
   * @throws AppError si usuario no existe
   */
  async getUserById(userId: number): Promise<UserWithoutPassword> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        logger.warn('Intento de obtener usuario que no existe', { userId });
        throw new AppError('Usuario no encontrado', 404);
      }

      logger.debug('Usuario obtenido', { userId });

      // Retornar usuario con rol en minúsculas
      return {
        ...user,
        role: user.role.toLowerCase() as any,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error obteniendo usuario:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los usuarios (solo para ADMIN)
   * @param limit - Límite de usuarios a retornar (default: 10)
   * @param offset - Offset para paginación (default: 0)
   * @returns Array de usuarios sin contraseña
   */
  async getAllUsers(limit: number = 10, offset: number = 0): Promise<{
    users: UserWithoutPassword[];
    total: number;
  }> {
    try {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            role: true,
            active: true,
            createdAt: true,
            updatedAt: true,
          },
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count(),
      ]);

      logger.debug('Usuarios obtenidos', { limit, offset, total });

      return {
        users: users.map((user) => ({
          ...user,
          role: user.role.toLowerCase() as any,
        })),
        total,
      };
    } catch (error) {
      logger.error('Error obteniendo usuarios:', error);
      throw error;
    }
  }

  /**
   * Actualizar usuario
   * @param userId - ID del usuario a actualizar
   * @param data - Datos a actualizar
   * @returns Usuario actualizado
   * @throws AppError si usuario no existe o datos son inválidos
   */
  async updateUser(
    userId: number,
    data: {
      email?: string;
      fullName?: string;
      role?: UserRole;
      active?: boolean;
    }
  ): Promise<UserWithoutPassword> {
    try {
      // Validar que usuario exista
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      // Si se intenta cambiar email, validar que no exista otro con ese email
      if (data.email && data.email !== user.email) {
        const existingEmail = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existingEmail) {
          throw new AppError('El email ya está en uso', 409);
        }
      }

      // Actualizar usuario
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('Usuario actualizado', { userId });

      return {
        ...updatedUser,
        role: updatedUser.role.toLowerCase() as any,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error actualizando usuario:', error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña de usuario
   * @param userId - ID del usuario
   * @param currentPassword - Contraseña actual
   * @param newPassword - Nueva contraseña
   * @throws AppError si contraseña actual es incorrecta
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Obtener usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      // Verificar contraseña actual
      const isPasswordValid = await comparePassword(
        currentPassword,
        user.passwordHash
      );

      if (!isPasswordValid) {
        logger.warn('Intento de cambio de contraseña con contraseña incorrecta', {
          userId,
        });
        throw new AppError('Contraseña actual incorrecta', 401);
      }

      // Hashear nueva contraseña
      const newPasswordHash = await hashPassword(newPassword);

      // Actualizar contraseña
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      logger.info('Contraseña cambiada exitosamente', { userId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error cambiando contraseña:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton del servicio
export const authService = new AuthService();
