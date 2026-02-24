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
   * Nota: El backend no tiene endpoint dedicado para roles
   * Retorna roles hardcodeados basados en el diseño del sistema
   */
  async getAllRoles(): Promise<Role[]> {
    try {
      // Retorna roles hardcodeados ya que el backend no tiene endpoint /roles
      return [
        {
          id: 1,
          name: 'ADMIN',
          description: 'Administrador del sistema',
          permissions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'GERENTE',
          description: 'Gerente de tienda',
          permissions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 3,
          name: 'CAJERO',
          description: 'Personal de caja',
          permissions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
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
   * Obtener permisos de un usuario específico
   * Retorna un mapa de módulos a booleanos indicando si tienen acceso
   */
  async getUserPermissions(userId: number): Promise<Record<string, boolean>> {
    try {
      const response = await apiClient.get<ApiResponse<{ permissions: Record<string, boolean> }>>(
        `/permissions/user/${userId}`
      );
      return response.data.permissions || {};
    } catch (error) {
      console.error(`Error fetching permissions for user ${userId}:`, error);
      return {};
    }
  }

  /**
   * Asignar permisos a un usuario
   * Recibe un mapa de módulos a booleanos
   */
  async assignPermissionsToRole(
    userId: number,
    permissionsMap: Record<string, boolean>
  ): Promise<boolean> {
    try {
      await apiClient.put(`/permissions/user/${userId}`, {
        permissions: permissionsMap,
      });
      return true;
    } catch (error) {
      console.error(`Error assigning permissions to user ${userId}:`, error);
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
  async getAvailableModules(): Promise<any[]> {
    try {
      const response = await apiClient.get<
        ApiResponse<{
          modules: Array<{
            id: number;
            key: string;
            name: string;
            description?: string;
            icon?: string;
            active: boolean;
            createdAt: string;
            updatedAt: string;
          }>;
        }>
      >('/permissions/modules');
      return response.data.modules || [];
    } catch (error) {
      console.error('Error fetching available modules:', error);
      // Retornar módulos por defecto si el endpoint falla
      return [
        { id: 1, key: 'users', name: 'Usuarios', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 2, key: 'inventory', name: 'Inventario', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 3, key: 'reports', name: 'Reportes', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 4, key: 'branches', name: 'Sucursales', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 5, key: 'settings', name: 'Configuración', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
    }
  }
}

export const permissionService = new PermissionService();
