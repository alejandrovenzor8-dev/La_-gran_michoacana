import { apiClient } from './client';
import type { ApiResponse, UserRole } from '../types';

export interface Permission {
  id: number;
  name: string;
  description?: string;
  module: string;
  active: boolean;
}

export interface Role {
  id: number;
  name: UserRole;
  description?: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface RolePermission {
  roleId: number;
  permissionId: number;
  role?: Role;
  permission?: Permission;
}

class PermissionService {
  /**
   * Obtener todos los permisos
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ permissions: Permission[] }>>(
        '/permissions'
      );
      return response.data.permissions || [];
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }
  }

  /**
   * Obtener permisos by módulo
   */
  async getPermissionsByModule(module: string): Promise<Permission[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ permissions: Permission[] }>>(
        `/permissions?module=${module}`
      );
      return response.data.permissions || [];
    } catch (error) {
      console.error(`Error fetching permissions for module ${module}:`, error);
      return [];
    }
  }

  /**
   * Obtener todos los roles
   */
  async getAllRoles(): Promise<Role[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ roles: Role[] }>>('/roles');
      return response.data.roles || [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  }

  /**
   * Obtener rol por ID
   */
  async getRoleById(id: number): Promise<Role | null> {
    try {
      const response = await apiClient.get<ApiResponse<{ role: Role }>>(`/roles/${id}`);
      return response.data.role;
    } catch (error) {
      console.error(`Error fetching role ${id}:`, error);
      return null;
    }
  }

  /**
   * Obtener permisos de un rol
   */
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ permissions: Permission[] }>>(
        `/roles/${roleId}/permissions`
      );
      return response.data.permissions || [];
    } catch (error) {
      console.error(`Error fetching permissions for role ${roleId}:`, error);
      return [];
    }
  }

  /**
   * Asignar permisos a un rol
   */
  async assignPermissionsToRole(
    roleId: number,
    permissionIds: number[]
  ): Promise<boolean> {
    try {
      await apiClient.post(`/roles/${roleId}/permissions`, {
        permissionIds,
      });
      return true;
    } catch (error) {
      console.error(`Error assigning permissions to role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Crear nuevo rol
   */
  async createRole(data: {
    name: UserRole;
    description?: string;
    permissionIds?: number[];
  }): Promise<Role | null> {
    try {
      const response = await apiClient.post<ApiResponse<{ role: Role }>>('/roles', data);
      return response.data.role;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Actualizar rol
   */
  async updateRole(
    id: number,
    data: {
      name?: UserRole;
      description?: string;
    }
  ): Promise<Role | null> {
    try {
      const response = await apiClient.put<ApiResponse<{ role: Role }>>(`/roles/${id}`, data);
      return response.data.role;
    } catch (error) {
      console.error(`Error updating role ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar rol
   */
  async deleteRole(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/roles/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting role ${id}:`, error);
      throw error;
    }
  }

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  async hasPermission(permissionName: string): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ hasPermission: boolean }>>(
        `/permissions/check/${permissionName}`
      );
      return response.data.hasPermission || false;
    } catch (error) {
      console.error(`Error checking permission ${permissionName}:`, error);
      return false;
    }
  }

  /**
   * Obtener módulos disponibles
   */
  async getAvailableModules(): Promise<string[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ modules: string[] }>>(
        '/permissions/modules'
      );
      return response.data.modules || [];
    } catch (error) {
      console.error('Error fetching available modules:', error);
      return [];
    }
  }
}

export const permissionService = new PermissionService();
