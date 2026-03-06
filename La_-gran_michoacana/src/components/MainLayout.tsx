import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { OpenCashDrawerModal } from './modals/OpenCashDrawerModal';
import { useAuthStore } from '@/stores/authStore';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const user = useAuthStore((state) => state.user);
  const [showOpenCashModal, setShowOpenCashModal] = useState(false);
  const [cashDrawerOpened, setCashDrawerOpened] = useState(false);

  // Mostrar modal de apertura de caja al iniciar sesión (solo para CAJERO y GERENTE)
  useEffect(() => {
    if (user && user.role !== 'ADMIN' && !cashDrawerOpened) {
      setShowOpenCashModal(true);
    }
  }, [user?.id, cashDrawerOpened]); // Usar user?.id para detectar cambio de usuario

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col pt-16 lg:pt-0">
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
