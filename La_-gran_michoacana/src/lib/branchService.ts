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
      throw error;
    }
  }

  /**
   * Actualizar el monto de caja inicial de una sucursal
   * @param id - ID de la sucursal
   * @param initialCash - Monto de caja inicial
   * @returns Sucursal actualizada
   */
  async updateInitialCash(id: number, initialCash: number): Promise<Branch> {
    try {
      const response = await apiClient.patch<UpdateBranchResponse>(
        `/branches/${id}/initial-cash`,
        { initialCash }
      );
      return response.data.branch;
    } catch (error) {
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
      throw error;
    }
  }
}

export const branchService = new BranchService();
