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
    branches: true,
    settings: true,
    permissions: true,
    reports: true,
    audit: true,
  },
  gerente: {
    pos: true,
    inventory: true,
    users: true,
    branches: true,
    settings: true,
    permissions: false,
    reports: true,
    audit: true,
  },
  cajero: {
    pos: true,
    inventory: false,
    users: false,
    branches: false,
    settings: false,
    permissions: false,
    reports: true,
    audit: false,
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
        const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[role];
        
        // Verificar si los permisos están vacíos o todos son false
        const arePermissionsEmpty = !existingPermissions || 
          Object.values(existingPermissions).every(value => value === false);
        
        // Si no existen permisos o están vacíos, inicializar con valores por defecto
        if (arePermissionsEmpty) {
          set((state) => ({
            userPermissions: {
              ...state.userPermissions,
              [username]: defaultPermissions,
            },
          }));
        } else {
          // Si ya existen permisos, agregar permisos faltantes para nuevos módulos
          const updatedPermissions = { ...existingPermissions };
          let hasChanges = false;
          
          AVAILABLE_MODULES.forEach((module) => {
            if (!(module.id in updatedPermissions)) {
              updatedPermissions[module.id] = defaultPermissions[module.id] || false;
              hasChanges = true;
            }
          });
          
          if (hasChanges) {
            set((state) => ({
              userPermissions: {
                ...state.userPermissions,
                [username]: updatedPermissions,
              },
            }));
          }
        }
      },
    }),
    {
      name: 'permissions-storage',
    }
  )
);
