import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Monitor, Settings, LogOut, Menu, X, Users } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from './ui/button';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const { user, logout } = useAuthStore((state) => ({
    user: state.user,
    logout: state.logout,
  }));

  const navItems: NavItem[] = [
    {
      id: 'pos',
      label: 'Punto de Venta',
      path: '/pos',
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      id: 'display',
      label: 'Pantalla Cliente',
      path: '/customer-display',
      icon: <Monitor className="w-5 h-5" />,
    },
    {
      id: 'users',
      label: 'Gestión de Usuarios',
      path: '/users',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Configuración',
      path: '/settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const handleLogout = async () => {
    logout();

    const isElectron = typeof window !== 'undefined' && window.electronAPI;
    if (isElectron) {
      try {
        console.log('📱 Notificando logout a Electron...');
        await window.electronAPI.logout();
        console.log('✅ Electron notificado de logout');
      } catch (err) {
        console.error('❌ Error notificando logout a Electron:', err);
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
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary text-white lg:hidden"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay en móvil cuando está abierto */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-primary to-primary/80 text-white shadow-xl transform transition-transform duration-300 z-40 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-white/20">
          <h1 className="text-xl font-bold">La Gran</h1>
          <h1 className="text-xl font-bold">Michoacana</h1>
          <p className="text-sm text-white/70 mt-2">Sistema POS</p>
        </div>

        {/* Usuario */}
        {user && (
          <div className="p-4 border-b border-white/20 bg-white/10">
            <p className="text-sm text-white/70">Usuario actual</p>
            <p className="font-semibold">{user.username}</p>
            <p className="text-xs text-white/70 capitalize">{user.role}</p>
          </div>
        )}

        {/* Navegación */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false); // Cerrar sidebar en móvil
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-white/25 border-l-4 border-white font-semibold'
                    : 'hover:bg-white/10'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer con Logout */}
        <div className="p-4 border-t border-white/20">
          <Button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>
    </>
  );
}
