import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

/**
 * Página especial que fuerza el logout limpiando TODO el almacenamiento
 */
export default function ForceLogoutPage() {
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);

  useEffect(() => {
    const clearEverything = async () => {
      try {
        // 1. Usar el logout del store
        logout();

        // 2. Limpiar localStorage completamente
        localStorage.clear();

        // 3. Limpiar sessionStorage
        sessionStorage.clear();

        // 4. Si es Electron, limpiar cookies también
        if (window.electronAPI) {
          try {
            await window.electronAPI.logout();
          } catch (e) {
            // Error al limpiar Electron
          }
        }

        // 5. Esperar un momento y redirigir al login
        setTimeout(() => {
          navigate('/login', { replace: true });
          window.location.reload();
        }, 500);
      } catch (error) {
        // Intentar de todos modos
        setTimeout(() => {
          navigate('/login', { replace: true });
          window.location.reload();
        }, 500);
      }
    };

    clearEverything();
  }, [logout, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cerrando sesión y limpiando datos...</p>
      </div>
    </div>
  );
}
