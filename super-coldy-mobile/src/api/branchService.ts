import { apiClient } from './client';
import { Branch, BranchCreateInput, BranchUpdateInput, BranchFilters } from '../types';

interface GetBranchesResponse {
  status: string;
  data: {
    branches: Branch[];
  };
}

interface GetBranchResponse {
  status: string;
  data: {
    branch: Branch;
  };
}

interface CreateBranchResponse {
  status: string;
  message: string;
  data: {
    branch: Branch;
  };
}

interface UpdateBranchResponse {
  status: string;
  message: string;
  data: {
    branch: Branch;
  };
}

interface DeleteBranchResponse {
  status: string;
  message: string;
}

/**
 * Servicio de sucursales para la app móvil
 * Maneja todas las operaciones HTTP relacionadas con sucursales
 */
export const branchService = {
  /**
   * Obtener lista de sucursales
   * @param filters - Filtros opcionales
   * @returns Lista de sucursales
   */
  async getBranches(filters?: BranchFilters): Promise<Branch[]> {
    try {
      const params: Record<string, any> = {};
      
      if (filters?.active !== undefined) {
        params.active = filters.active;
      }

      const response = await apiClient.get<GetBranchesResponse>('/branches', { 
        params 
      });
      return response.data.branches;
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  },

  /**
   * Obtener una sucursal por ID
   * @param id - ID de la sucursal
   * @returns Datos de la sucursal
   */
  async getBranchById(id: number): Promise<Branch> {
    try {
      const response = await apiClient.get<GetBranchResponse>(`/branches/${id}`);
      return response.data.branch;
    } catch (error) {
      console.error(`Error fetching branch ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crear una nueva sucursal
   * @param data - Datos de la sucursal
   * @returns Sucursal creada
   */
  async createBranch(data: BranchCreateInput): Promise<Branch> {
    try {
      const response = await apiClient.post<CreateBranchResponse>('/branches', data);
      return response.data.branch;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  },

  /**
   * Actualizar una sucursal
   * @param id - ID de la sucursal
   * @param data - Datos a actualizar
   * @returns Sucursal actualizada
   */
  async updateBranch(id: number, data: BranchUpdateInput): Promise<Branch> {
    try {
      const response = await apiClient.put<UpdateBranchResponse>(
        `/branches/${id}`,
        data
      );
      return response.data.branch;
    } catch (error) {
      console.error(`Error updating branch ${id}:`, error);
      throw error;
    }
  },

  /**
   * Activar/desactivar una sucursal
   * @param id - ID de la sucursal
   * @param active - Estado activo/inactivo
   * @returns Sucursal actualizada
   */
  async toggleBranchStatus(id: number, active: boolean): Promise<Branch> {
    try {
      const response = await apiClient.patch<UpdateBranchResponse>(
        `/branches/${id}/status`,
        { active }
      );
      return response.data.branch;
    } catch (error) {
      console.error(`Error toggling branch ${id} status:`, error);
      throw error;
    }
  },

  /**
   * Eliminar una sucursal
   * @param id - ID de la sucursal
   * @returns void
   */
  async deleteBranch(id: number): Promise<void> {
    try {
      await apiClient.delete<DeleteBranchResponse>(`/branches/${id}`);
    } catch (error) {
      console.error(`Error deleting branch ${id}:`, error);
      throw error;
    }
  },
};
