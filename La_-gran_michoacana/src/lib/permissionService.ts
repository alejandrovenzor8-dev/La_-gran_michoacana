import { apiClient } from './apiClient';

export interface Module {
  id: number;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPermissions {
  [moduleKey: string]: boolean;
}

interface GetModulesResponse {
  status: string;
  data: {
    modules: Module[];
  };
}

interface GetPermissionsResponse {
  status: string;
  data: {
    userId?: number;
    username?: string;
    permissions: UserPermissions;
  };
}

interface UpdatePermissionsResponse {
  status: string;
  message: string;
  data: {
    userId?: number;
    username?: string;
    permissionsUpdated: number;
  };
}

/**
 * Servicio de permisos
 * Maneja todas las operaciones HTTP relacionadas con permisos y módulos
 */
class PermissionService {
  /**
   * Obtener lista de módulos disponibles
   */
  async getModules(): Promise<Module[]> {
    try {
      const response = await apiClient.get<GetModulesResponse>('/permissions/modules');
      return response.data.modules;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener permisos de un usuario por ID
   * @param userId - ID del usuario
   */
  async getUserPermissionsById(userId: number): Promise<UserPermissions> {
    try {
      const response = await apiClient.get<GetPermissionsResponse>(
        `/permissions/user/${userId}`
      );
      return response.data.permissions;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener permisos de un usuario por username
   * @param username - Username del usuario
   */
  async getUserPermissionsByUsername(username: string): Promise<UserPermissions> {
    try {
      const response = await apiClient.get<GetPermissionsResponse>(
        `/permissions/username/${username}`
      );
      return response.data.permissions;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar permisos de un usuario por ID
   * @param userId - ID del usuario
   * @param permissions - Objeto con los permisos { moduleKey: boolean }
   */
  async updateUserPermissionsById(
    userId: number,
    permissions: UserPermissions
  ): Promise<void> {
    try {
      await apiClient.put<UpdatePermissionsResponse>(`/permissions/user/${userId}`, {
        permissions,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar permisos de un usuario por username
   * @param username - Username del usuario
   * @param permissions - Objeto con los permisos { moduleKey: boolean }
   */
  async updateUserPermissionsByUsername(
    username: string,
    permissions: UserPermissions
  ): Promise<void> {
    try {
      await apiClient.put<UpdatePermissionsResponse>(
        `/permissions/username/${username}`,
        {
          permissions,
        }
      );
    } catch (error) {
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const permissionService = new PermissionService();
