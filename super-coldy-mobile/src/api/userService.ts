import { apiClient } from './client';
import type { User, ApiResponse, UserRole } from '../types';

class UserService {
  /**
   * Obtener todos los usuarios
   */
  async getAllUsers(filters?: {
    role?: UserRole;
    active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<User[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.role) params.append('role', filters.role);
      if (filters?.active !== undefined) params.append('active', String(filters.active));
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const queryString = params.toString();
      const endpoint = `/users${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<ApiResponse<{ users: User[] }>>(endpoint);
      return response.data.users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(id: number): Promise<User | null> {
    try {
      const response = await apiClient.get<ApiResponse<{ user: User }>>(`/users/${id}`);
      return response.data.user || null;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return null;
    }
  }

  /**
   * Crear nuevo usuario
   */
  async createUser(data: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    role: UserRole;
  }): Promise<User | null> {
    try {
      const response = await apiClient.post<ApiResponse<{ user: User }>>('/users', data);
      return response.data.user || null;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Actualizar usuario
   */
  async updateUser(
    id: number,
    data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<User | null> {
    try {
      const response = await apiClient.put<ApiResponse<{ user: User }>>(`/users/${id}`, data);
      return response.data.user || null;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Cambiar estado del usuario (activo/inactivo)
   */
  async toggleUserStatus(id: number): Promise<User | null> {
    try {
      const response = await apiClient.patch<ApiResponse<{ user: User }>>(`/users/${id}/toggle-status`, {});
      return response.data.user || null;
    } catch (error) {
      console.error(`Error toggling user status ${id}:`, error);
      throw error;
    }
  }

  /**
   * Cambiar rol del usuario
   */
  async changeUserRole(id: number, role: UserRole): Promise<User | null> {
    try {
      const response = await apiClient.patch<ApiResponse<{ user: User }>>(`/users/${id}/role`, { role });
      return response.data.user || null;
    } catch (error) {
      console.error(`Error changing user role ${id}:`, error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña del usuario
   */
  async changePassword(
    id: number,
    data: {
      oldPassword: string;
      newPassword: string;
    }
  ): Promise<boolean> {
    try {
      await apiClient.post<ApiResponse<null>>(`/users/${id}/change-password`, data);
      return true;
    } catch (error) {
      console.error(`Error changing password for user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Resetear contraseña de usuario (Admin)
   */
  async resetPassword(id: number): Promise<{ temporaryPassword: string } | null> {
    try {
      const response = await apiClient.post<ApiResponse<{ temporaryPassword: string }>>(
        `/users/${id}/reset-password`,
        {}
      );
      return response.data || null;
    } catch (error) {
      console.error(`Error resetting password for user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar usuario
   */
  async deleteUser(id: number): Promise<boolean> {
    try {
      await apiClient.delete<ApiResponse<null>>(`/users/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Array<{ role: UserRole; count: number }>;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/users/stats');
      const data = response.data;
      return {
        total: data.totalUsers || 0,
        active: data.activeUsers || 0,
        inactive: data.inactiveUsers || 0,
        byRole: data.byRole || [],
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Retornar valores por defecto en lugar de fallar
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byRole: [],
      };
    }
  }

  /**
   * Buscar usuarios
   */
  async searchUsers(query: string): Promise<User[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ users: User[] }>>(`/users/search?q=${query}`);
      return response.data.users || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * Cambiar contraseña del usuario actual
   */
  async changeOwnPassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response.status === 200;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña de otro usuario (admin)
   */
  async changeUserPassword(userId: number, newPassword: string): Promise<User | null> {
    try {
      const response = await apiClient.post<ApiResponse<{ user: User }>>(`/users/${userId}/change-password`, {
        newPassword,
      });
      return response.data.user || null;
    } catch (error) {
      console.error(`Error changing password for user ${userId}:`, error);
      throw error;
    }
  }
}

export const userService = new UserService();
