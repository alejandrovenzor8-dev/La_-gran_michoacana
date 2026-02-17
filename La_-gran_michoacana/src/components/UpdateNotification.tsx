import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UpdateInfo {
  version: string;
  releaseNotes?: string;
}

interface DownloadProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

export default function UpdateNotification() {
  const [updateStatus, setUpdateStatus] = useState<'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error' | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Solo funciona en Electron
    if (!window.electronAPI) return;

    // Escuchar estado de actualización
    const unsubscribeStatus = window.electronAPI.onUpdateStatus((status, data) => {
      setUpdateStatus(status as any);
      
      if (status === 'available' && data) {
        setUpdateInfo(data);
        setShowNotification(true);
        toast.info('Nueva actualización disponible', {
          description: `Versión ${data.version}`,
          duration: 10000,
        });
      } else if (status === 'error') {
        toast.error('Error al buscar actualizaciones', {
          description: data?.message,
        });
      } else if (status === 'not-available') {
        toast.success('Sistema actualizado', {
          description: 'Tienes la última versión',
        });
      }
    });

    // Escuchar actualización disponible
    const unsubscribeAvailable = window.electronAPI.onUpdateAvailable((info) => {
      setUpdateInfo(info);
      setShowNotification(true);
    });

    // Escuchar progreso de descargaprogress
    const unsubscribeProgress = window.electronAPI.onDownloadProgress((progress) => {
      setDownloadProgress(progress);
    });

    // Escuchar actualización descargada
    const unsubscribeDownloaded = window.electronAPI.onUpdateDownloaded((info) => {
      setShowNotification(true);
      toast.success('Actualización lista', {
        description: `Versión ${info.version} descargada. Reinicia para instalar.`,
        duration: Infinity,
        action: {
          label: 'Reiniciar ahora',
          onClick: () => window.electronAPI?.installUpdate(),
        },
      });
    });

    return () => {
      unsubscribeStatus();
      unsubscribeAvailable();
      unsubscribeProgress();
      unsubscribeDownloaded();
    };
  }, []);

  const handleDownload = () => {
    if (window.electronAPI) {
      window.electronAPI.downloadUpdate();
      setUpdateStatus('downloading');
      toast.info('Descargando actualización...', {
        description: 'El proceso continuará en segundo plano',
      });
    }
  };

  const handleInstall = () => {
    if (window.electronAPI) {
      window.electronAPI.installUpdate();
    }
  };

  const handleCheckForUpdates = () => {
    if (window.electronAPI) {
      setUpdateStatus('checking');
      window.electronAPI.checkForUpdates();
      toast.info('Buscando actualizaciones...', {
        description: 'Verificando servidor',
      });
    }
  };

  // No mostrar si no es Electron o no hay actualización
  if (!window.electronAPI || !showNotification) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {/* Actualización disponible */}
      {updateStatus === 'available' && updateInfo && (
        <Card className="shadow-lg border-primary">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-primary mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Nueva versión disponible</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Versión {updateInfo.version}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    onClick={handleDownload}
                    className="h-8 text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Descargar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowNotification(false)}
                    className="h-8 text-xs"
                  >
                    Después
                  </Button>
                </div>
              </div>
              <button 
                onClick={() => setShowNotification(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Descargando */}
      {updateStatus === 'downloading' && downloadProgress && (
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-primary mt-1 animate-spin" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Descargando actualización</h3>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${downloadProgress.percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {downloadProgress.percent.toFixed(1)}% - {(downloadProgress.transferred / 1024 / 1024).toFixed(1)} MB de {(downloadProgress.total / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Descargada */}
      {updateStatus === 'downloaded' && updateInfo && (
        <Card className="shadow-lg border-green-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Actualización lista</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Versión {updateInfo.version} descargada
                </p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    onClick={handleInstall}
                    className="h-8 text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reiniciar e instalar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowNotification(false)}
                    className="h-8 text-xs"
                  >
                    Al cerrar
                  </Button>
                </div>
              </div>
              <button 
                onClick={() => setShowNotification(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón flotante para verificar actualizaciones */}
      {!showNotification && (
        <button
          onClick={handleCheckForUpdates}
          className="fixed bottom-4 right-4 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary/90 transition-all"
          title="Buscar actualizaciones"
        >
          <RefreshCw className={`w-5 h-5 ${updateStatus === 'checking' ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}
