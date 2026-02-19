import prisma from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logger } from '../utils/logger.js';

/**
 * Interface para crear una sucursal
 */
export interface BranchCreateInput {
  name: string;
  address?: string;
  phone?: string;
  active?: boolean;
}

/**
 * Interface para actualizar una sucursal
 */
export interface BranchUpdateInput {
  name?: string;
  address?: string;
  phone?: string;
  active?: boolean;
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
          active: data.active ?? true,
        },
      });

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

      // Verificar que la sucursal existe
      await this.getBranchById(id);

      const branch = await prisma.branch.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.active !== undefined && { active: data.active }),
        },
      });

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
   */
  async deleteBranch(id: number): Promise<void> {
    try {
      logger.info('Eliminando sucursal:', id);

      // Verificar que la sucursal existe
      await this.getBranchById(id);

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

      logger.info('Sucursal eliminada exitosamente:', id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al eliminar sucursal:', error);
      throw new AppError('Error al eliminar la sucursal', 500);
    }
  }
}

export const branchService = new BranchService();
