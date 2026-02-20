import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Info, Database, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { 
  getConfiguredTimezone, 
  setConfiguredTimezone, 
  MEXICO_TIMEZONES,
  formatDate 
} from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/apiClient';

export default function SettingsPage() {
  const [timezone, setTimezone] = useState<string>(getConfiguredTimezone());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const user = useAuthStore((state) => state.user);

  // Actualizar la hora cada segundo para mostrar el preview
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTimezoneChange = async (newTimezone: string) => {
    setTimezone(newTimezone);
    setIsSaving(true);
    
    try {
      // 1. Guardar en localStorage (para acceso rápido)
      setConfiguredTimezone(newTimezone);
      
      // 2. Guardar en Railway si el usuario está autenticado
      if (user?.id) {
        // Si es admin, actualizar para TODOS los usuarios
        if (user.role === 'ADMIN') {
          await apiClient.put('/settings/timezone', {
            timezone: newTimezone,
          });
          
          // Actualizar el authStore del admin actual también
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const parsed = JSON.parse(authStorage);
            if (parsed.state?.user) {
              parsed.state.user.timezone = newTimezone;
              localStorage.setItem('auth-storage', JSON.stringify(parsed));
            }
          }
          
          toast.success('Zona horaria global actualizada', {
            description: `Configuración aplicada a todos los usuarios del sistema: ${MEXICO_TIMEZONES.find(tz => tz.value === newTimezone)?.label}`,
          });
        } else {
          // Si no es admin, solo actualizar su propio usuario
          await apiClient.put(`/users/${user.id}`, {
            timezone: newTimezone,
          });
          
          // Actualizar el authStore
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const parsed = JSON.parse(authStorage);
            if (parsed.state?.user) {
              parsed.state.user.timezone = newTimezone;
              localStorage.setItem('auth-storage', JSON.stringify(parsed));
            }
          }
          
          toast.success('Zona horaria guardada', {
            description: `Configuración guardada en Railway: ${MEXICO_TIMEZONES.find(tz => tz.value === newTimezone)?.label}`,
          });
        }
      } else {
        toast.success('Zona horaria actualizada', {
          description: `Solo en este navegador: ${MEXICO_TIMEZONES.find(tz => tz.value === newTimezone)?.label}`,
        });
      }
    } catch (error) {
      console.error('Error al guardar timezone:', error);
      toast.error('Error al guardar', {
        description: 'La zona horaria se guardó localmente pero no en el servidor',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-primary" />
            Configuración
          </h1>
          <p className="text-gray-600">Administra la configuración del sistema POS</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configuración de Zona Horaria */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold text-gray-800">Zona Horaria</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Selecciona tu zona horaria {isSaving && <span className="text-primary">(guardando...)</span>}
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => handleTimezoneChange(e.target.value)}
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {MEXICO_TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                  {user && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <span>✓</span> 
                      {user.role === 'ADMIN' 
                        ? 'Configuración GLOBAL - Se aplica a todos los usuarios del sistema' 
                        : 'Sincronizado con Railway (se aplica en todos tus dispositivos)'}
                    </p>
                  )}
                </div>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Vista previa de hora actual:</p>
                  <p className="text-lg font-bold text-gray-800">
                    {formatDate(currentTime)}
                  </p>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Las ventas se guardan en UTC en Railway</p>
                  <p>• Esta configuración solo afecta cómo ves las fechas</p>
                  {user?.role === 'ADMIN' ? (
                    <p className="text-orange-600 font-semibold">• Como ADMIN, cambiar la zona actualiza TODOS los usuarios</p>
                  ) : (
                    <p>• {user ? 'Guardado en tu cuenta' : 'Solo en este navegador'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Sistema */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold text-gray-800">Información del Sistema</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Versión de Aplicación</p>
                  <p className="font-semibold text-gray-800">v1.0.2</p>
                </div>
                <div>
                  <p className="text-gray-600">Nombre del Negocio</p>
                  <p className="font-semibold text-gray-800">La Gran Michoacana</p>
                </div>
                <div>
                  <p className="text-gray-600">Última Actualización</p>
                  <p className="font-semibold text-gray-800">20 de Febrero de 2026</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gestión de Datos */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold text-gray-800">Gestión de Datos</h3>
              </div>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    if (confirm('¿Deseas exportar los datos del carrito actual?')) {
                    }
                  }}
                >
                  Exportar Datos
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (confirm('¿Deseas limpiar todos los datos locales? Esta acción no se puede deshacer.')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                >
                  Limpiar Datos Locales
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Pantalla */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Pantalla del Cliente</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Estado</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="font-semibold text-gray-800">Conectada</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {
                    const displayWindow = window.open('/customer-display', 'CustomerDisplay');
                    if (displayWindow) {
                      displayWindow.resizeTo(1920, 1080);
                    }
                  }}
                >
                  Abrir en Nueva Ventana
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ayuda */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Ayuda y Soporte</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Para agregar productos, selecciona del catálogo</p>
                <p>• Usa el carrito para administrar la venta</p>
                <p>• La pantalla del cliente muestra el resumen</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
