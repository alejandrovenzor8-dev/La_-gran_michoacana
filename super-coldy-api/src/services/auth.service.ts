import prisma from '../config/database.js';
import { AppError, asyncHandler } from '../middlewares/errorHandler.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
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
  branchId?: number;
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
    branchId: number | null;
    branch?: {
      id: number;
      name: string;
    } | null;
    timezone: string;
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
      const { username, email, password, fullName, role = 'CAJERO', branchId } = data;

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

      // Convertir role a uppercase para Prisma (enum values)
      const roleUppercase = (role.toUpperCase() as UserRole) || 'CAJERO';

      // Crear usuario
      const user = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          fullName: fullName || null,
          role: roleUppercase,
          branchId: branchId || null,
          active: true,
        },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          branchId: true,
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          active: true,
          timezone: true,
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
        include: {
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
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

      // Retornar datos sin contraseña
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          branchId: user.branchId,
          branch: user.branch,
          timezone: user.timezone || 'America/Mexico_City', // Zona horaria del usuario
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
          branchId: true,
          active: true,
          timezone: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        logger.warn('Intento de obtener usuario que no existe', { userId });
        throw new AppError('Usuario no encontrado', 404);
      }

      logger.debug('Usuario obtenido', { userId });

      // Retornar usuario
      return {
        ...user,
        role: user.role,
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
            branchId: true,
            active: true,
            timezone: true,
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
          role: user.role,
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
      timezone?: string;
      branchId?: number | null;
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

      // Construir objeto de actualización de forma explícita
      const updateData: any = {};
      
      if (data.email !== undefined) updateData.email = data.email;
      if (data.fullName !== undefined) updateData.fullName = data.fullName;
      if (data.role !== undefined) updateData.role = data.role.toUpperCase() as UserRole;
      if (data.active !== undefined) updateData.active = data.active;
      if (data.timezone !== undefined) updateData.timezone = data.timezone;
      if (data.branchId !== undefined) updateData.branchId = data.branchId;

      // Actualizar usuario
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          branchId: true,
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          active: true,
          timezone: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('Usuario actualizado', { userId, timezone: data.timezone });

      return {
        ...updatedUser,
        role: updatedUser.role,
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

  /**
   * Eliminar usuario
   * @param userId - ID del usuario a eliminar
   * @throws AppError si usuario no existe
   */
  async deleteUser(userId: number): Promise<void> {
    try {
      // Validar que usuario exista
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      // No permitir eliminar al único admin
      if (user.role === 'ADMIN') {
        const adminCount = await prisma.user.count({
          where: { role: 'ADMIN' },
        });

        if (adminCount === 1) {
          throw new AppError('No se puede eliminar el único administrador', 400);
        }
      }

      // Eliminar usuario
      await prisma.user.delete({
        where: { id: userId },
      });

      logger.info('Usuario eliminado', { userId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error eliminando usuario:', error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña de un usuario (por admin, sin necesitar contraseña actual)
   * @param userId - ID del usuario
   * @param newPassword - Nueva contraseña
   * @returns Usuario actualizado
   * @throws AppError si usuario no existe
   */
  async changeUserPassword(userId: number, newPassword: string): Promise<any> {
    try {
      // Validar que usuario exista
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          active: true,
          timezone: true,
          branchId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      // Hashear nueva contraseña
      const newPasswordHash = await hashPassword(newPassword);

      // Actualizar contraseña
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          active: true,
          timezone: true,
          branchId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('Contraseña de usuario cambiada por admin', { userId });
      return updatedUser;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error cambiando contraseña de usuario:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async getUserStats() {
    try {
      const [total, active, byRole] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { active: true } }),
        prisma.user.groupBy({
          by: ['role'],
          _count: true,
        }),
      ]);

      logger.debug('Estadísticas de usuarios obtenidas', { total, active });

      return {
        totalUsers: total,
        activeUsers: active,
        inactiveUsers: total - active,
        byRole: byRole.map((r: any) => ({
          role: r.role,
          count: r._count,
        })),
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de usuarios:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton del servicio
export const authService = new AuthService();
