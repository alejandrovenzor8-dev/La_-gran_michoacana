import prisma from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logger } from '../utils/logger.js';
import { createAuditLog, AuditAction } from '../utils/auditLogger.js';

/**
 * Interface para crear una sucursal
 */
export interface BranchCreateInput {
  name: string;
  address?: string;
  phone?: string;
  initialCash?: number;
  active?: boolean;
  userId?: number; // Para auditoría
  ipAddress?: string; // Para auditoría
  userAgent?: string; // Para auditoría
}

/**
 * Interface para actualizar una sucursal
 */
export interface BranchUpdateInput {
  name?: string;
  address?: string;
  phone?: string;
  initialCash?: number;
  active?: boolean;
  userId?: number; // Para auditoría
  ipAddress?: string; // Para auditoría
  userAgent?: string; // Para auditoría
}

/**
 * Interface para filtros de sucursales
 */
export interface BranchFilters {
  active?: boolean;
}

/**
 * Servicio de Sucursales
 * Maneja todas las operaciones CRUD relacionadas con sucursales
 */
class BranchService {
  /**
   * Crear una nueva sucursal
   * @param data - Datos de la sucursal
   * @returns Sucursal creada
   */
  async createBranch(data: BranchCreateInput): Promise<any> {
    try {
      logger.info('Creando sucursal en la base de datos');

      const branch = await prisma.branch.create({
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          initialCash: data.initialCash || 0,
          active: data.active ?? true,
        },
      });

      // Registrar auditoría
      if (data.userId) {
        await createAuditLog({
          userId: data.userId,
          branchId: branch.id,
          action: AuditAction.CREATE,
          entity: 'Branch',
          entityId: branch.id,
          description: `Sucursal creada: ${branch.name}`,
          newValues: {
            name: branch.name,
            address: branch.address,
            phone: branch.phone,
            initialCash: branch.initialCash,
          },
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        });
      }

      logger.info('Sucursal creada exitosamente:', branch.id);
      return branch;
    } catch (error) {
      logger.error('Error al crear sucursal:', error);
      throw new AppError('Error al crear la sucursal', 500);
    }
  }

  /**
   * Obtener todas las sucursales con filtros opcionales
   * @param filters - Filtros a aplicar
   * @returns Lista de sucursales
   */
  async getAllBranches(filters: BranchFilters): Promise<any[]> {
    try {
      logger.debug('Obteniendo sucursales de la base de datos');

      const where: any = {};

      if (filters.active !== undefined) {
        where.active = filters.active;
      }

      const branches = await prisma.branch.findMany({
        where,
        orderBy: {
          name: 'asc',
        },
        include: {
          _count: {
            select: {
              users: true,
              sales: true,
              products: true,
            },
          },
        },
      });

      logger.debug(`${branches.length} sucursales encontradas`);
      return branches;
    } catch (error) {
      logger.error('Error al obtener sucursales:', error);
      throw new AppError('Error al obtener las sucursales', 500);
    }
  }

  /**
   * Obtener una sucursal por ID
   * @param id - ID de la sucursal
   * @returns Sucursal encontrada
   * @throws AppError si no se encuentra la sucursal
   */
  async getBranchById(id: number): Promise<any> {
    try {
      logger.debug('Buscando sucursal por ID:', id);

      const branch = await prisma.branch.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true,
              sales: true,
              products: true,
            },
          },
        },
      });

      if (!branch) {
        throw new AppError('Sucursal no encontrada', 404);
      }

      return branch;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al obtener sucursal por ID:', error);
      throw new AppError('Error al obtener la sucursal', 500);
    }
  }

  /**
   * Actualizar una sucursal
   * @param id - ID de la sucursal
   * @param data - Datos a actualizar
   * @returns Sucursal actualizada
   * @throws AppError si no se encuentra la sucursal
   */
  async updateBranch(id: number, data: BranchUpdateInput): Promise<any> {
    try {
      logger.info('Actualizando sucursal:', id);

      // Verificar que la sucursal existe y obtener valores anteriores
      const oldBranch = await this.getBranchById(id);

      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.initialCash !== undefined) updateData.initialCash = data.initialCash;
      if (data.active !== undefined) updateData.active = data.active;

      const branch = await prisma.branch.update({
        where: { id },
        data: updateData,
      });

      // Registrar auditoría
      if (data.userId) {
        const changes: string[] = [];
        if (data.name && data.name !== oldBranch.name) changes.push('nombre');
        if (data.address !== undefined && data.address !== oldBranch.address) changes.push('dirección');
        if (data.phone !== undefined && data.phone !== oldBranch.phone) changes.push('teléfono');
        if (data.initialCash !== undefined && data.initialCash !== oldBranch.initialCash) changes.push('caja inicial');
        if (data.active !== undefined && data.active !== oldBranch.active) changes.push('estado');

        await createAuditLog({
          userId: data.userId,
          branchId: id,
          action: AuditAction.UPDATE,
          entity: 'Branch',
          entityId: id,
          description: `Sucursal actualizada: ${branch.name} (${changes.join(', ')})`,
          oldValues: {
            name: oldBranch.name,
            address: oldBranch.address,
            phone: oldBranch.phone,
            initialCash: oldBranch.initialCash,
            active: oldBranch.active,
          },
          newValues: {
            name: branch.name,
            address: branch.address,
            phone: branch.phone,
            initialCash: branch.initialCash,
            active: branch.active,
          },
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        });
      }

      logger.info('Sucursal actualizada exitosamente:', id);
      return branch;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al actualizar sucursal:', error);
      throw new AppError('Error al actualizar la sucursal', 500);
    }
  }

  /**
   * Activar/Desactivar una sucursal
   * @param id - ID de la sucursal
   * @param active - Estado activo/inactivo
   * @returns Sucursal actualizada
   */
  async toggleBranchStatus(id: number, active: boolean): Promise<any> {
    try {
      logger.info('Cambiando estado de sucursal:', { id, active });

      // Verificar que la sucursal existe
      await this.getBranchById(id);

      const branch = await prisma.branch.update({
        where: { id },
        data: { active },
      });

      logger.info('Estado de sucursal actualizado:', id);
      return branch;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al cambiar estado de sucursal:', error);
      throw new AppError('Error al cambiar el estado de la sucursal', 500);
    }
  }

  /**
   * Eliminar una sucursal (soft delete cambiando active a false)
   * @param id - ID de la sucursal
   * @param userId - ID del usuario que realiza la acción (para auditoría)
   */
  async deleteBranch(id: number, userId?: number, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      logger.info('Eliminando sucursal:', id);

      // Verificar que la sucursal existe
      const branch = await this.getBranchById(id);

      // Verificar que no tenga usuarios activos
      const usersCount = await prisma.user.count({
        where: {
          branchId: id,
          active: true,
        },
      });

      if (usersCount > 0) {
        throw new AppError(
          'No se puede eliminar una sucursal con usuarios activos',
          400
        );
      }

      // Soft delete
      await prisma.branch.update({
        where: { id },
        data: { active: false },
      });

      // Registrar auditoría
      if (userId) {
        await createAuditLog({
          userId,
          branchId: id,
          action: AuditAction.DELETE,
          entity: 'Branch',
          entityId: id,
          description: `Sucursal desactivada: ${branch.name}`,
          oldValues: {
            active: true,
          },
          newValues: {
            active: false,
          },
          ipAddress,
          userAgent,
        });
      }

      logger.info('Sucursal eliminada exitosamente:', id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al eliminar sucursal:', error);
      throw new AppError('Error al eliminar la sucursal', 500);
    }
  }

  /**
   * Actualizar la caja inicial de una sucursal
   * @param id - ID de la sucursal
   * @param initialCash - Nuevo monto de caja inicial
   * @param userId - ID del usuario que realiza la acción
   * @returns Sucursal actualizada
   */
  async updateInitialCash(
    id: number,
    initialCash: number,
    userId?: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<any> {
    try {
      logger.info('Actualizando caja inicial de sucursal:', { id, initialCash });

      // Verificar que la sucursal existe
      const oldBranch = await this.getBranchById(id);

      const branch = await prisma.branch.update({
        where: { id },
        data: { initialCash },
      });

      // Registrar auditoría
      if (userId) {
        await createAuditLog({
          userId,
          branchId: id,
          action: AuditAction.UPDATE,
          entity: 'Branch',
          entityId: id,
          description: `Caja inicial actualizada en ${branch.name}: $${oldBranch.initialCash} → $${initialCash}`,
          oldValues: {
            initialCash: oldBranch.initialCash,
          },
          newValues: {
            initialCash: branch.initialCash,
          },
          ipAddress,
          userAgent,
        });
      }

      logger.info('Caja inicial actualizada exitosamente:', id);
      return branch;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al actualizar caja inicial:', error);
      throw new AppError('Error al actualizar la caja inicial', 500);
    }
  }
}

export const branchService = new BranchService();
