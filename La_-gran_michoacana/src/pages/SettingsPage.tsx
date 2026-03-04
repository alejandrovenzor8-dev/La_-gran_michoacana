import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Info, Database, Clock, Download, AlertCircle, CheckCircle, Lock, Gauge, Cpu, MemoryStick, Zap } from 'lucide-react';
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
import { usePerformanceStore } from '@/stores/performanceStore';
import { apiClient } from '@/lib/apiClient';
import { userService } from '@/lib/userService';

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
  
  // Performance store
  const { 
    useBasicMode, 
    isAutoDetected, 
    systemResources, 
    setBasicMode, 
    detectSystemResources 
  } = usePerformanceStore();

  // Estados para impresoras
  const [printers, setPrinters] = useState<Array<{ name: string; displayName: string; isDefault: boolean }>>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [loadingPrinters, setLoadingPrinters] = useState(true);
  const [loadingSavedPrinter, setLoadingSavedPrinter] = useState(false);
  const [savingPrinter, setSavingPrinter] = useState(false);
  const [printerMessage, setPrinterMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasSavedPrinter, setHasSavedPrinter] = useState(false);

  // Estados para cambio de contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Estados para el modal de actualizaciones
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  // Cargar impresoras disponibles
  useEffect(() => {
    const loadPrinters = async () => {
      try {
        // Validar que existe la API de Electron
        if (typeof window === 'undefined' || !window.electronAPI?.getPrinters) {
          setLoadingPrinters(false);
          return;
        }

        // Validar que el usuario tiene una sucursal asignada
        if (!user?.branchId || user.branchId < 1) {
          setLoadingPrinters(false);
          setSelectedPrinter('');
          setHasSavedPrinter(false);
          return;
        }

        // Cargar lista de impresoras del sistema
        let printersList: Array<{ name: string; displayName: string; isDefault: boolean }> = [];
        try {
          printersList = await window.electronAPI.getPrinters();
          
          // Validar que es un array válido
          if (!Array.isArray(printersList)) {
            console.warn('getPrinters() no retornó un array válido');
            printersList = [];
          }
        } catch (systemError) {
          console.error('Error obteniendo impresoras del sistema:', systemError);
          setPrinterMessage({
            type: 'error',
            text: 'No se pudieron detectar las impresoras del sistema'
          });
          printersList = [];
        }

        setPrinters(printersList || []);

        // Cargar impresora guardada si existe
        if (printersList && printersList.length > 0) {
          setLoadingSavedPrinter(true);
          try {
            const savedPrinter = await window.electronAPI.getSavedPrinter(user.branchId);

            // Validar respuesta
            if (
              savedPrinter &&
              typeof savedPrinter === 'object' &&
              'printerName' in savedPrinter &&
              savedPrinter.printerName
            ) {
              // Verificar que la impresora guardada existe en la lista
              const printerExists = printersList.some(
                p => p.name === savedPrinter.printerName
              );

              if (printerExists) {
                setSelectedPrinter(String(savedPrinter.printerName));
                setHasSavedPrinter(true);
              } else {
                // Impresora guardada no existe en el sistema actual
                console.warn(
                  `Impresora guardada "${savedPrinter.printerName}" no encontrada en el sistema`
                );
                setSelectedPrinter('');
                setHasSavedPrinter(false);
              }
            } else {
              // No hay impresora guardada
              setSelectedPrinter('');
              setHasSavedPrinter(false);
            }
          } catch (savedError) {
            // Error cargando impresora guardada (probablemente null en BD)
            console.info('No hay impresora guardada para esta sucursal:', savedError);
            setSelectedPrinter('');
            setHasSavedPrinter(false);
          } finally {
            setLoadingSavedPrinter(false);
          }
        } else {
          setSelectedPrinter('');
          setHasSavedPrinter(false);
          setLoadingSavedPrinter(false);
        }
      } catch (error) {
        console.error('Error en loadPrinters:', error);
        setPrinterMessage({
          type: 'error',
          text: 'Error al cargar la configuración de impresoras'
        });
        setPrinters([]);
        setSelectedPrinter('');
        setHasSavedPrinter(false);
      } finally {
        setLoadingPrinters(false);
      }
    };

    // Solo cargar si el usuario está disponible
    if (user?.branchId) {
      loadPrinters();
    } else {
      setLoadingPrinters(false);
    }
  }, [user?.branchId]);

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
    const unsubscribeDownloaded = window.electronAPI?.onUpdateDownloaded?.((_info: any) => {
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

  const handleSavePrinter = async () => {
    // Validaciones
    if (!selectedPrinter || typeof selectedPrinter !== 'string' || selectedPrinter.trim() === '') {
      setPrinterMessage({ type: 'error', text: 'Selecciona una impresora válida' });
      return;
    }

    if (!user?.branchId || user.branchId < 1) {
      setPrinterMessage({ type: 'error', text: 'Usuario sin sucursal asignada' });
      return;
    }

    // Verificar que la impresora seleccionada existe en la lista
    const selectedPrinterExists = printers.some(p => p.name === selectedPrinter);
    if (!selectedPrinterExists) {
      setPrinterMessage({ type: 'error', text: 'La impresora seleccionada no existe' });
      return;
    }

    setSavingPrinter(true);
    setPrinterMessage(null);

    try {
      // Validar que existe la API de Electron
      if (!window.electronAPI?.savePrinter) {
        throw new Error('API de Electron no disponible');
      }

      const result = await window.electronAPI.savePrinter(selectedPrinter, user.branchId);

      // Validar respuesta
      if (!result || typeof result !== 'object') {
        throw new Error('Respuesta inválida del servidor');
      }

      if (result.success === true) {
        setHasSavedPrinter(true);
        setPrinterMessage({
          type: 'success',
          text: `✓ Impresora guardada: ${selectedPrinter}`
        });
        
        // Limpiar mensaje después de 4 segundos
        setTimeout(() => setPrinterMessage(null), 4000);
      } else {
        const errorMsg = result.error || 'Error desconocido al guardar la impresora';
        setPrinterMessage({
          type: 'error',
          text: `✗ ${errorMsg}`
        });
      }
    } catch (error) {
      console.error('Error guardando impresora:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error al guardar la impresora';
      
      setPrinterMessage({
        type: 'error',
        text: `✗ ${errorMessage}`
      });
    } finally {
      setSavingPrinter(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    // Validaciones
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Todos los campos son requeridos');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setIsChangingPassword(true);
      await userService.changeOwnPassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      toast.success('Contraseña actualizada', {
        description: 'Tu contraseña ha sido cambiada exitosamente',
      });
      
      // Limpiar formulario y cerrar modal
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordModal(false);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al cambiar la contraseña';
      setPasswordError(message);
      toast.error('Error', {
        description: message,
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-3 md:p-4 lg:p-6">
      <div className="max-w-4xl">
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2 md:gap-3 mb-2">
            <Settings className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-primary" />
            Configuración
          </h1>
          <p className="text-sm md:text-base text-gray-600">Administra la configuración del sistema POS</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Configuración de Zona Horaria */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                <h3 className="text-lg md:text-xl font-semibold text-gray-800">Zona Horaria</h3>
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

          {/* Configuración de Impresoras */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800">🖨️ Impresoras</h3>
                {loadingSavedPrinter && (
                  <span className="text-xs text-gray-500 animate-pulse">(cargando...)</span>
                )}
              </div>
              <div className="space-y-4">
                {loadingPrinters ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Detectando impresoras del sistema...</p>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : printers.length > 0 ? (
                  <>
                    {/* Info de impresora guardada */}
                    {hasSavedPrinter && selectedPrinter && (
                      <div className="bg-green-50 p-3 rounded-md border border-green-200">
                        <p className="text-xs text-green-700 font-semibold">
                          ✓ Impresora configurada para esta sucursal:
                        </p>
                        <p className="text-sm text-green-900 font-bold mt-1">
                          {printers.find(p => p.name === selectedPrinter)?.displayName || selectedPrinter}
                        </p>
                      </div>
                    )}

                    {/* Selector de impresora */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Selecciona una impresora {printers.length > 0 && `(${printers.length} disponible${printers.length !== 1 ? 's' : ''})`}
                      </label>
                      <select
                        value={selectedPrinter || ''}
                        onChange={(e) => {
                          setSelectedPrinter(e.target.value);
                          setPrinterMessage(null);
                        }}
                        disabled={savingPrinter || loadingSavedPrinter}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Seleccionar impresora --</option>
                        {printers.map((printer) => (
                          <option key={printer.name} value={printer.name}>
                            {printer.displayName}
                            {printer.isDefault ? ' (predeterminada del sistema)' : ''}
                            {selectedPrinter === printer.name ? ' ✓' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Vista previa de selección */}
                    {selectedPrinter && (
                      <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-xs text-blue-700">
                        <strong>Seleccionada:</strong> {printers.find(p => p.name === selectedPrinter)?.displayName || selectedPrinter}
                      </div>
                    )}

                    {/* Botón guardar */}
                    <Button
                      onClick={handleSavePrinter}
                      disabled={savingPrinter || !selectedPrinter || loadingSavedPrinter}
                      className="w-full"
                    >
                      {savingPrinter ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Guardando configuración...
                        </>
                      ) : hasSavedPrinter && selectedPrinter === (printers.find(p => p.name === selectedPrinter)?.name) ? (
                        '✓ Impresora Configurada'
                      ) : (
                        '💾 Guardar Impresora'
                      )}
                    </Button>

                    {/* Mensajes */}
                    {printerMessage && (
                      <div
                        className={`p-3 rounded-md text-sm ${
                          printerMessage.type === 'success'
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {printerMessage.text}
                      </div>
                    )}

                    {/* Instrucciones */}
                    {!hasSavedPrinter && (
                      <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
                        📌 Selecciona una impresora y haz clic en "Guardar" para configurarla como predeterminada en esta sucursal.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      ⚠️ No hay impresoras disponibles en tu sistema
                    </p>
                    <p className="text-xs text-gray-500">
                      Verifica que:
                    </p>
                    <ul className="text-xs text-gray-500 space-y-1 ml-4">
                      <li>• Hay impresoras conectadas a tu equipo</li>
                      <li>• Los drivers están instalados correctamente</li>
                      <li>• Recarga la página para reintentar la detección</li>
                    </ul>
                  </div>
                )}
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

          {/* Seguridad - Cambio de Contraseña */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold text-gray-800">Seguridad</h3>
              </div>
              <div className="space-y-3 text-sm mb-4">
                <p className="text-gray-600">Administra tu contraseña y configuración de seguridad</p>
              </div>
              <Button
                onClick={() => setShowPasswordModal(true)}
                className="w-full"
              >
                <Lock className="w-4 h-4 mr-2" />
                Cambiar Contraseña
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

          {/* Rendimiento y Optimización */}
          <Card className="hover:shadow-lg transition-shadow col-span-1 md:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Gauge className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold text-gray-800">Rendimiento y Optimización</h3>
              </div>
              
              <div className="space-y-4">
                {/* Información de recursos del sistema */}
                {systemResources && (
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      Recursos del Sistema Detectados
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <MemoryStick className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-gray-600">Memoria RAM</p>
                          <p className="font-semibold text-gray-800">
                            {systemResources.totalMemoryGB.toFixed(1)} GB
                            {systemResources.isLowMemory && <span className="text-orange-600 ml-1">(Baja)</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-gray-600">Núcleos CPU</p>
                          <p className="font-semibold text-gray-800">
                            {systemResources.cpuCount}
                            {systemResources.isLowCPU && <span className="text-orange-600 ml-1">(Bajo)</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-purple-500" />
                        <div>
                          <p className="text-gray-600">Arquitectura</p>
                          <p className="font-semibold text-gray-800">
                            {systemResources.arch === 'ia32' ? '32 bits' : '64 bits'}
                            {systemResources.is32Bit && <span className="text-orange-600 ml-1">(⚠️)</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-gray-600">Modelo CPU</p>
                          <p className="font-semibold text-gray-800 truncate" title={systemResources.cpuModel}>
                            {systemResources.cpuModel.split(' ').slice(0, 3).join(' ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Control del modo de rendimiento */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-800 mb-1">Modo de Rendimiento Actual</p>
                      <p className="text-xs text-blue-700">
                        {useBasicMode ? (
                          <>
                            <strong>Modo Básico:</strong> Animaciones desactivadas para mejor rendimiento en equipos con recursos limitados.
                          </>
                        ) : (
                          <>
                            <strong>Modo Completo:</strong> Todas las animaciones y efectos visuales activados.
                          </>
                        )}
                      </p>
                      {isAutoDetected && (
                        <p className="text-xs text-blue-600 mt-1">
                          ℹ️ Este modo fue configurado automáticamente según los recursos de tu sistema.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setBasicMode(true, false)}
                      variant={useBasicMode ? "default" : "outline"}
                      className="flex-1"
                    >
                      <Gauge className="w-4 h-4 mr-2" />
                      Modo Básico
                      {useBasicMode && <CheckCircle className="w-4 h-4 ml-2" />}
                    </Button>
                    <Button
                      onClick={() => setBasicMode(false, false)}
                      variant={!useBasicMode ? "default" : "outline"}
                      className="flex-1"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Modo Completo
                      {!useBasicMode && <CheckCircle className="w-4 h-4 ml-2" />}
                    </Button>
                  </div>

                  <Button
                    onClick={async () => {
                      toast.info('Detectando recursos del sistema...');
                      await detectSystemResources();
                      toast.success('Recursos detectados', {
                        description: 'El modo de rendimiento ha sido configurado automáticamente.'
                      });
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Cpu className="w-4 h-4 mr-2" />
                    Detectar Recursos Automáticamente
                  </Button>
                </div>

                {/* Información adicional */}
                <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                  <p className="font-semibold text-gray-700 mb-2">¿Cuándo usar Modo Básico?</p>
                  <p>• Equipos con 2GB de RAM o menos</p>
                  <p>• Sistemas de 32 bits</p>
                  <p>• Procesadores de 1 núcleo o muy antiguos</p>
                  <p>• Si notas que la aplicación está lenta</p>
                  <p className="mt-2 text-green-600">
                    ✅ El Modo Básico desactiva todas las animaciones CSS y transiciones, mejorando significativamente el rendimiento.
                  </p>
                </div>
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
          <div className={`fixed inset-0 flex items-center justify-center z-50 ${useBasicMode ? 'bg-black/90' : 'bg-black/50'}`}>
            <div className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto ${useBasicMode ? '' : 'animate-in fade-in zoom-in-95 duration-200'}`}>
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

        {/* Modal de Cambio de Contraseña */}
        {showPasswordModal && (
          <div className={`fixed inset-0 flex items-center justify-center z-50 ${useBasicMode ? 'bg-black/90' : 'bg-black/50'}`}>
            <Card className={`w-full max-w-md mx-4 ${useBasicMode ? '' : 'animate-in fade-in zoom-in-95 duration-200'}`}>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Cambiar Contraseña</h2>
                <p className="text-gray-600 text-sm mb-6">Actualiza tu contraseña para mantener tu cuenta segura</p>

                {passwordError && (
                  <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contraseña Actual *
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      placeholder="Ingresa tu contraseña actual"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isChangingPassword}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nueva Contraseña *
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      placeholder="Ingresa tu nueva contraseña (mín. 6 caracteres)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isChangingPassword}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirmar Nueva Contraseña *
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      placeholder="Confirma tu nueva contraseña"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isChangingPassword}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? 'Guardando...' : 'Cambiar Contraseña'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordForm({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                        setPasswordError('');
                      }}
                      disabled={isChangingPassword}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
