import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Info, Database, Clock, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import packageJson from '../../package.json';
import { 
  getConfiguredTimezone, 
  setConfiguredTimezone, 
  MEXICO_TIMEZONES,
  formatDate 
} from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/apiClient';

// Type definition para window.api (Electron)
declare global {
  interface Window {
    electronAPI?: {
      checkForUpdates: () => void;
      downloadUpdate: () => void;
      installUpdate: () => void;
      onUpdateAvailable: (callback: (info: any) => void) => () => void;
      onDownloadProgress: (callback: (progress: any) => void) => () => void;
      onUpdateDownloaded: (callback: (info: any) => void) => () => void;
      onUpdateError: (callback: (error: any) => void) => () => void;
      onUpdateNotAvailable: (callback: () => void) => () => void;
    }
  }
}

export default function SettingsPage() {
  const [timezone, setTimezone] = useState<string>(getConfiguredTimezone());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const user = useAuthStore((state) => state.user);

  // Estados para el modal de actualizaciones
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  // Actualizar la hora cada segundo para mostrar el preview
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Escuchar eventos de actualización de Electron
  useEffect(() => {
    if (!window.electronAPI) return;

    // Escuchar cuando hay actualización disponible
    const unsubscribeAvailable = window.electronAPI?.onUpdateAvailable?.((info: any) => {
      setUpdateInfo(info);
      setUpdateError(null);
      setCheckingUpdates(false);
      setShowUpdateModal(true);
    });

    // Escuchar cuando se está descargando
    const unsubscribeProgress = window.electronAPI?.onDownloadProgress?.((progress: any) => {
      setDownloadProgress(Math.round(progress.percent));
      setIsDownloading(true);
    });

    // Escuchar cuando la descarga está completa
    const unsubscribeDownloaded = window.electronAPI?.onUpdateDownloaded?.((info: any) => {
      setIsDownloading(false);
      setUpdateDownloaded(true);
      toast.success('Actualización descargada', {
        description: 'Reinicia la aplicación para instalar los cambios',
      });
    });

    // Escuchar errores
    const unsubscribeError = window.electronAPI?.onUpdateError?.((error: any) => {
      setUpdateError(error.message || 'Error al verificar actualizaciones');
      setCheckingUpdates(false);
      setShowUpdateModal(true);
    });

    // Escuchar cuando no hay actualizaciones
    const unsubscribeNotAvailable = window.electronAPI?.onUpdateNotAvailable?.(() => {
      setUpdateInfo(null);
      setUpdateError(null);
      setCheckingUpdates(false);
      setShowUpdateModal(true);
      toast.info('Sistema actualizado', {
        description: 'Ya tienes la versión más reciente',
      });
    });

    return () => {
      unsubscribeAvailable?.();
      unsubscribeProgress?.();
      unsubscribeDownloaded?.();
      unsubscribeError?.();
      unsubscribeNotAvailable?.();
    };
  }, []);

  // Función para verificar actualizaciones
  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    setUpdateError(null);
    setUpdateInfo(null);
    setDownloadProgress(0);
    setIsDownloading(false);
    setUpdateDownloaded(false);

    // Enviar mensaje a Electron para verificar actualizaciones
    if (window.electronAPI?.checkForUpdates) {
      window.electronAPI.checkForUpdates();
    }
  };

  // Función para descargar la actualización
  const handleDownloadUpdate = () => {
    setIsDownloading(true);
    if (window.electronAPI?.downloadUpdate) {
      window.electronAPI.downloadUpdate();
    }
  };

  // Función para instalar la actualización
  const handleInstallUpdate = () => {
    if (window.electronAPI?.installUpdate) {
      window.electronAPI.installUpdate();
    }
  };

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
                  <p className="font-semibold text-gray-800">v{packageJson.version}</p>
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
              <Button
                onClick={handleCheckUpdates}
                disabled={checkingUpdates}
                className="w-full mt-4"
              >
                <Download className="w-4 h-4 mr-2" />
                {checkingUpdates ? 'Verificando...' : 'Verificar Actualizaciones'}
              </Button>
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

        {/* Modal de Actualizaciones */}
        {showUpdateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {updateError ? (
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    ) : updateInfo ? (
                      <Download className="w-6 h-6 text-blue-500" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                    <h2 className="text-xl font-bold text-gray-800">
                      {updateError ? 'Error' : updateInfo ? 'Actualización Disponible' : 'Sistema Actualizado'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Contenido */}
                {updateError ? (
                  <div className="space-y-4">
                    <p className="text-red-600 text-sm">{updateError}</p>
                    <Button
                      onClick={() => setShowUpdateModal(false)}
                      className="w-full"
                    >
                      Cerrar
                    </Button>
                  </div>
                ) : updateInfo ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Nueva versión disponible:</p>
                      <p className="text-lg font-bold text-blue-600">{updateInfo.version}</p>
                    </div>

                    {updateInfo.releaseNotes && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Cambios:</p>
                        <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 max-h-24 overflow-y-auto">
                          {updateInfo.releaseNotes}
                        </div>
                      </div>
                    )}

                    {isDownloading && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Descargando: {downloadProgress}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${downloadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {updateDownloaded ? (
                        <Button
                          onClick={handleInstallUpdate}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Instalar Ahora
                        </Button>
                      ) : (
                        <Button
                          onClick={handleDownloadUpdate}
                          disabled={isDownloading}
                          className="flex-1"
                        >
                          {isDownloading ? 'Descargando...' : 'Descargar Actualización'}
                        </Button>
                      )}
                      <Button
                        onClick={() => setShowUpdateModal(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Después
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-green-600 text-sm">Tu aplicación está actualizada a la última versión.</p>
                    <Button
                      onClick={() => setShowUpdateModal(false)}
                      className="w-full"
                    >
                      Cerrar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
