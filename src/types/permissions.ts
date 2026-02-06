// Tipos de módulos disponibles en el sistema
export type ModuleType = 'pos' | 'inventory' | 'users' | 'settings' | 'permissions';

// Interfaz de permisos de usuario (simple - solo acceso/no acceso)
export interface UserPermissions {
  [module: string]: boolean;
}

// Configuración de permisos por rol
export interface RolePermissions {
  pos: boolean;
  inventory: boolean;
  users: boolean;
  settings: boolean;
  permissions: boolean;
}

// Información completa del módulo
export interface ModuleInfo {
  id: ModuleType;
  label: string;
  description: string;
}

// Lista de módulos disponibles
export const AVAILABLE_MODULES: ModuleInfo[] = [
  {
    id: 'pos',
    label: 'Punto de Venta',
    description: 'Gestión de ventas y cobros',
  },
  {
    id: 'inventory',
    label: 'Inventario',
    description: 'Control de productos y stock',
  },
  {
    id: 'users',
    label: 'Gestión de Usuarios',
    description: 'Administración de usuarios del sistema',
  },
  {
    id: 'settings',
    label: 'Configuración',
    description: 'Ajustes generales del sistema',
  },
  {
    id: 'permissions',
    label: 'Permisos y Seguridad',
    description: 'Gestión de permisos de usuarios',
  },
];
