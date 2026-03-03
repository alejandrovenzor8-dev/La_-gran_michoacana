import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Settings, LogOut, Menu, X, Users, Package, Shield, BarChart3, Building } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { usePermissionsStore } from '@/stores/permissionsStore';
import { usePerformanceStore } from '@/stores/performanceStore';
import { Button } from './ui/button';
import type { ModuleType } from '@/types/permissions';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  module: ModuleType;
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [logoImage, setLogoImage] = useState<string>('./logo.png');
  const { user, logout } = useAuthStore((state) => ({
    user: state.user,
    logout: state.logout,
  }));

  const { hasPermission } = usePermissionsStore();
  const { useBasicMode } = usePerformanceStore();

  // Cargar ruta del logo desde Electron
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
        if (isElectron) {
          const result = await (window as any).electronAPI.getLogoPath();
          if (result.success && result.path) {
            setLogoImage(result.path);
          }
        }
      } catch (err) {
        console.error('Error cargando logo:', err);
      }
    };
    loadLogo();
  }, []);

  const navItems: NavItem[] = [
    {
      id: 'pos',
      label: 'Punto de Venta',
      path: '/pos',
      icon: <ShoppingCart className="w-5 h-5" />,
      module: 'pos' as ModuleType,
    },
    {
      id: 'inventory',
      label: 'Inventario',
      path: '/inventory',
      icon: <Package className="w-5 h-5" />,
      module: 'inventory' as ModuleType,
    },
    {
      id: 'reports',
      label: 'Reportes',
      path: '/reports',
      icon: <BarChart3 className="w-5 h-5" />,
      module: 'reports' as ModuleType,
    },
    {
      id: 'users',
      label: 'Gestión de Usuarios',
      path: '/users',
      icon: <Users className="w-5 h-5" />,
      module: 'users' as ModuleType,
    },
    {
      id: 'branches',
      label: 'Gestión de Sucursales',
      path: '/branches',
      icon: <Building className="w-5 h-5" />,
      module: 'branches' as ModuleType,
    },
    {
      id: 'permissions',
      label: 'Permisos y Seguridad',
      path: '/permissions',
      icon: <Shield className="w-5 h-5" />,
      module: 'permissions' as ModuleType,
    },
    {
      id: 'settings',
      label: 'Configuración',
      path: '/settings',
      icon: <Settings className="w-5 h-5" />,
      module: 'settings' as ModuleType,
    },
  ];

  // Filtrar elementos del menú basándose en permisos del usuario
  const visibleNavItems = navItems.filter((item) => {
    if (!user) return false;
    return hasPermission(user.username, item.module);
  });

  const handleLogout = async () => {
    logout();

    const isElectron = typeof window !== 'undefined' && window.electronAPI;
    if (isElectron) {
      try {
        await window.electronAPI.logout();
      } catch (err) {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <>
      {/* Botón para expandir/contraer en pantallas pequeñas */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary text-white shadow-lg lg:hidden hover:bg-primary/90 transition-colors"
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay en móvil cuando está abierto */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      {/* Sidebar - En modo básico usa display, en modo normal usa transform */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-primary to-primary/80 text-white shadow-xl z-40 lg:static flex flex-col
          ${useBasicMode 
            ? `${isOpen ? 'block lg:block' : 'hidden lg:block'}` 
            : `transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
          }`}
      >
        {/* Header del Sidebar - más compacto en pantallas pequeñas */}
        <div className="p-4 md:p-6 border-b border-white/20 flex flex-col items-center gap-2 md:gap-3 flex-shrink-0">
          <img
            src={logoImage}
            alt="La Gran Michoacana"
            className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover"
          />
          <div className="text-center">
            <h1 className="text-base md:text-lg font-bold">La Gran</h1>
            <h1 className="text-base md:text-lg font-bold">Michoacana</h1>
            <p className="text-xs text-white/70 mt-1 md:mt-2">Sistema POS</p>
          </div>
        </div>

        {/* Usuario - más compacto */}
        {user && (
          <div className="p-3 md:p-4 border-b border-white/20 bg-white/10 flex-shrink-0">
            <p className="text-xs md:text-sm text-white/70">Usuario actual</p>
            <p className="font-semibold text-sm md:text-base">{user.username}</p>
            <p className="text-xs text-white/70 capitalize">{user.role}</p>
          </div>
        )}

        {/* Navegación - con scroll */}
        <nav className="flex-1 overflow-y-auto p-3 md:p-4 space-y-1.5 md:space-y-2">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false); // Cerrar sidebar en móvil
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-lg text-sm md:text-base ${
                  useBasicMode ? '' : 'transition-all duration-200'
                } ${
                  isActive
                    ? 'bg-white/25 border-l-4 border-white font-semibold'
                    : 'hover:bg-white/10'
                }`}
              >
                {item.icon}
                <span className="text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer con Logout */}
        <div className="p-3 md:p-4 border-t border-white/20 flex-shrink-0">
          <Button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center justify-center gap-2 text-sm md:text-base py-2 md:py-2.5"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>
    </>
  );
}
