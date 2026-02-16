import prisma from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logger } from '../utils/logger.js';
import type { User, UserRole } from '@prisma/client';

interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role: UserRole;
}

interface UpdateUserInput {
  username?: string;
  email?: string;
  fullName?: string;
  role?: UserRole;
  active?: boolean;
}

interface UserFilters {
  role?: UserRole;
  active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

class UserService {
  /**
   * Obtener todos los usuarios con filtros
   */
  async getAllUsers(filters: UserFilters = {}) {
    const { role, active, search, page = 1, limit = 50 } = filters;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (active !== undefined) {
      where.active = active;
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId: number) {
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
      throw new AppError('Usuario no encontrado', 404);
    }

    return user;
  }

  /**
   * Crear nuevo usuario
   */
  async createUser(data: CreateUserInput) {
    // Verificar que no exista el username o email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email },
        ],
      },
    });

    if (existing) {
      throw new AppError('El username o email ya existe', 400);
    }

    // Hash de la contraseña
    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        role: data.role,
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

    logger.info(`Usuario creado: ${user.username}`, { userId: user.id, role: user.role });

    return user;
  }

  /**
   * Actualizar usuario
   */
  async updateUser(userId: number, data: UpdateUserInput) {
    // Verificar que el usuario existe
    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Si se actualiza username o email, verificar que no estén en uso
    if (data.username || data.email) {
      const conflict = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                data.username ? { username: data.username } : {},
                data.email ? { email: data.email } : {},
              ],
            },
          ],
        },
      });

      if (conflict) {
        throw new AppError('El username o email ya está en uso', 400);
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.username && { username: data.username }),
        ...(data.email && { email: data.email }),
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.role && { role: data.role }),
        ...(data.active !== undefined && { active: data.active }),
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

    logger.info(`Usuario actualizado: ${user.username}`, { userId: user.id });

    return user;
  }

  /**
   * Desactivar usuario (soft delete)
   */
  async deactivateUser(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    if (!user.active) {
      throw new AppError('El usuario ya está desactivado', 400);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { active: false },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        active: true,
      },
    });

    logger.info(`Usuario desactivado: ${updated.username}`, { userId: updated.id });

    return updated;
  }

  /**
   * Activar usuario
   */
  async activateUser(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    if (user.active) {
      throw new AppError('El usuario ya está activo', 400);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { active: true },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        active: true,
      },
    });

    logger.info(`Usuario activado: ${updated.username}`, { userId: updated.id });

    return updated;
  }

  /**
   * Estadísticas de usuarios
   */
  async getUserStats() {
    const [total, active, byRole] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { active: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byRole: byRole.map((r: any) => ({
        role: r.role,
        count: r._count,
      })),
    };
  }
}

export const userService = new UserService();
