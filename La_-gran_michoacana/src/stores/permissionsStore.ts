import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ModuleType,
  UserPermissions,
  AVAILABLE_MODULES,
} from '@/types/permissions';

interface PermissionsStore {
  // Permisos por usuario
  userPermissions: Record<string, UserPermissions>;
  
  // Obtener permisos de un usuario
  getUserPermissions: (username: string) => UserPermissions;
  
  // Actualizar permisos de un usuario
  updateUserPermissions: (username: string, permissions: UserPermissions) => void;
  
  // Verificar si un usuario tiene permiso
  hasPermission: (username: string, module: ModuleType) => boolean;
  
  // Inicializar permisos predeterminados para un usuario
  initializeUserPermissions: (username: string, role: 'admin' | 'cajero' | 'gerente') => void;
}

// Permisos predeterminados por rol
const DEFAULT_ROLE_PERMISSIONS: Record<'admin' | 'cajero' | 'gerente', UserPermissions> = {
  admin: {
    pos: true,
    inventory: true,
    users: true,
    settings: true,
    permissions: true,
    reports: true,
  },
  gerente: {
    pos: true,
    inventory: true,
    users: true,
    settings: true,
    permissions: false,
    reports: true,
  },
  cajero: {
    pos: true,
    inventory: true,
    users: false,
    settings: false,
    permissions: false,
    reports: true,
  },
};

export const usePermissionsStore = create<PermissionsStore>()(
  persist(
    (set, get) => ({
      userPermissions: {},

      getUserPermissions: (username: string) => {
        const permissions = get().userPermissions[username];
        if (!permissions) {
          // Si no hay permisos, retornar permisos vacíos
          const emptyPermissions: UserPermissions = {};
          AVAILABLE_MODULES.forEach((module) => {
            emptyPermissions[module.id] = false;
          });
          return emptyPermissions;
        }
        return permissions;
      },

      updateUserPermissions: (username: string, permissions: UserPermissions) => {
        set((state) => ({
          userPermissions: {
            ...state.userPermissions,
            [username]: permissions,
          },
        }));
      },

      hasPermission: (username: string, module: ModuleType) => {
        const permissions = get().getUserPermissions(username);
        return permissions[module] || false;
      },

      initializeUserPermissions: (username: string, role: 'admin' | 'cajero' | 'gerente') => {
        const existingPermissions = get().userPermissions[username];
        
        // Si ya existen permisos, no sobrescribir
        if (existingPermissions) {
          return;
        }

        // Asignar permisos predeterminados según el rol
        const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[role];
        
        set((state) => ({
          userPermissions: {
            ...state.userPermissions,
            [username]: defaultPermissions,
          },
        }));
      },
    }),
    {
      name: 'permissions-storage',
    }
  )
);
