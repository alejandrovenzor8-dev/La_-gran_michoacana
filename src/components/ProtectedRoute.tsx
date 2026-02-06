import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { usePermissionsStore } from '@/stores/permissionsStore';
import { ModuleType } from '@/types/permissions';

interface ProtectedRouteProps {
  children: ReactNode;
  module: ModuleType;
}

export function ProtectedRoute({
  children,
  module,
}: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user);
  const hasPermission = usePermissionsStore((state) => state.hasPermission);

  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permisos del usuario
  const userHasPermission = hasPermission(user.username, module);

  // Si no tiene permisos, mostrar mensaje de acceso denegado o redirigir
  if (!userHasPermission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-6">
            No tienes los permisos necesarios para acceder a este módulo.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Usuario: <span className="font-medium">{user.username}</span>
            <br />
            Rol: <span className="font-medium">{user.role}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
