import { useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { onCartUpdate } from '@/lib/broadcastSync';

/**
 * Hook para sincronizar cambios de otras ventanas
 * Escucha mensajes de BroadcastChannel y actualiza el store
 */
export const useBroadcastListener = () => {
  useEffect(() => {
    // Escuchar actualizaciones de carrito desde otras ventanas
    const unsubscribe = onCartUpdate((data) => {
      if (data && data.items) {
        // Actualizar el store con los datos de la otra ventana
        useCartStore.setState({ items: data.items });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);
};
