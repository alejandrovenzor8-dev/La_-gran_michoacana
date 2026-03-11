import { ReactNode, useEffect, useState } from 'react';
import { Activity, CloudOff, RefreshCw } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { OpenCashDrawerModal } from './modals/OpenCashDrawerModal';
import { useAuthStore } from '@/stores/authStore';
import { useNetworkStore } from '@/stores/networkStore';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const user = useAuthStore((state) => state.user);
  const healthStatus = useNetworkStore((state) => state.healthStatus);
  const latencyMs = useNetworkStore((state) => state.latencyMs);
  const pendingSalesCount = useNetworkStore((state) => state.pendingSalesCount);
  const isSyncingSales = useNetworkStore((state) => state.isSyncingSales);
  const [showOpenCashModal, setShowOpenCashModal] = useState(false);
  const [cashDrawerOpened, setCashDrawerOpened] = useState(false);

  const statusStyles = {
    online: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    degraded: 'bg-amber-100 text-amber-800 border-amber-200',
    offline: 'bg-red-100 text-red-800 border-red-200',
  } as const;

  const statusLabel = {
    online: 'Conexion estable',
    degraded: 'Conexion lenta',
    offline: 'Sin conexion',
  } as const;

  // Mostrar modal de apertura de caja al iniciar sesión (solo para CAJERO y GERENTE)
  useEffect(() => {
    if (user && user.role !== 'ADMIN' && !cashDrawerOpened) {
      setShowOpenCashModal(true);
    }
  }, [user?.id, cashDrawerOpened]); // Usar user?.id para detectar cambio de usuario

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="relative flex-1 overflow-hidden flex flex-col pt-16 lg:pt-0">
        <div className="pointer-events-none absolute right-2 top-2 z-20 flex flex-col items-end gap-1 md:right-3 md:top-3">
          <div className="pointer-events-auto text-xs md:text-sm">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium shadow-sm ${statusStyles[healthStatus]}`}>
              {healthStatus === 'offline' ? <CloudOff className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
              <span>{statusLabel[healthStatus]}</span>
              {latencyMs !== null && <span>{latencyMs} ms</span>}
            </div>
          </div>

          {pendingSalesCount > 0 && (
            <div className="pointer-events-auto text-xs md:text-sm">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-medium text-sky-800 shadow-sm">
                {isSyncingSales && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>{pendingSalesCount} venta{pendingSalesCount === 1 ? '' : 's'} pendiente{pendingSalesCount === 1 ? '' : 's'} de sincronizar</span>
              </div>
            </div>
          )}
        </div>
        {children}
      </main>

      {/* Modal de apertura de caja al iniciar sesión */}
      <OpenCashDrawerModal
        isOpen={showOpenCashModal}
        onClose={() => setShowOpenCashModal(false)}
        onComplete={() => {
          setShowOpenCashModal(false);
          setCashDrawerOpened(true);
        }}
      />
    </div>
  );
}
