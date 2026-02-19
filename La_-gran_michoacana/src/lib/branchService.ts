import { apiClient } from './apiClient';
import { Branch, BranchCreateInput, BranchUpdateInput, BranchFilters } from '../types/branch';

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
 * Servicio de sucursales
 * Maneja todas las operaciones HTTP relacionadas con sucursales
 */
class BranchService {
  /**
   * Obtener lista de sucursales
   * @param filters - Filtros opcionales
   * @returns Lista de sucursales
   */
  async getBranches(filters?: BranchFilters): Promise<Branch[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.active !== undefined) {
        params.append('active', filters.active.toString());
      }

      const queryString = params.toString();
      const url = queryString ? `/branches?${queryString}` : '/branches';
      
      const response = await apiClient.get<GetBranchesResponse>(url);
      return response.data.branches;
    } catch (error) {
      console.error('Error obteniendo sucursales:', error);
      throw error;
    }
  }

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
      console.error(`Error obteniendo sucursal ${id}:`, error);
      throw error;
    }
  }

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
      console.error('Error creando sucursal:', error);
      throw error;
    }
  }

  /**
   * Actualizar una sucursal
   * @param id - ID de la sucursal
   * @param data - Datos a actualizar
   * @returns Sucursal actualizada
   */
  async updateBranch(id: number, data: BranchUpdateInput): Promise<Branch> {
    try {
      const response = await apiClient.put<UpdateBranchResponse>(`/branches/${id}`, data);
      return response.data.branch;
    } catch (error) {
      console.error(`Error actualizando sucursal ${id}:`, error);
      throw error;
    }
  }

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
      console.error(`Error cambiando estado de sucursal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar una sucursal
   * @param id - ID de la sucursal
   */
  async deleteBranch(id: number): Promise<void> {
    try {
      await apiClient.delete<DeleteBranchResponse>(`/branches/${id}`);
    } catch (error) {
      console.error(`Error eliminando sucursal ${id}:`, error);
      throw error;
    }
  }
}

export const branchService = new BranchService();
