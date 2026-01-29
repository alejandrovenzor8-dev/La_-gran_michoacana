import { useEffect, useState, useCallback } from 'react';
import { useCartStore } from '@/store/cartStore';

/**
 * Hook personalizado para sincronización continua del carrito
 * Se suscribe a cambios en tiempo real y mantiene ambas pantallas en sync
 */
export const useCartSync = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Obtener estado actual del store
  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);
  const getItemCount = useCartStore((state) => state.getItemCount);

  useEffect(() => {
    // Suscribirse a CUALQUIER cambio en el store
    const unsubscribe = useCartStore.subscribe(
      (state) => ({ items: state.items, total: state.getTotal() }),
      () => {
        // Cuando el store cambie, disparar re-render
        setRefreshTrigger((prev) => prev + 1);
      }
    );

    // Escuchar cambios en localStorage desde otras ventanas/tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'cart-storage') {
        setRefreshTrigger((prev) => prev + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Retornar el estado actual del carrito
  return {
    items,
    total: getTotal(),
    itemCount: getItemCount(),
    refreshTrigger, // Cambio cada vez que hay actualización
  };
};
