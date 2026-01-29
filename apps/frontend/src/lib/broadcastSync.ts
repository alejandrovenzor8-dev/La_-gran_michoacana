/**
 * Canal de comunicación entre ventanas usando BroadcastChannel
 * Permite sincronización en tiempo real entre la ventana POS y la ventana del cliente
 */

import { CartItem } from '@/store/cartStore';

interface CartUpdateMessage {
  items: CartItem[];
  total: number;
}

let broadcastChannel: BroadcastChannel | null = null;

/**
 * Obtener o crear el canal de broadcast
 */
export const getBroadcastChannel = (): BroadcastChannel => {
  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel('pos-cart-sync');
  }
  return broadcastChannel;
};

/**
 * Enviar actualización de carrito a todas las ventanas
 */
export const broadcastCartUpdate = (cartData: CartUpdateMessage) => {
  try {
    const channel = getBroadcastChannel();
    channel.postMessage({
      type: 'CART_UPDATE',
      payload: cartData,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('BroadcastChannel no soportado:', error);
  }
};

/**
 * Escuchar actualizaciones de carrito desde otras ventanas
 */
export const onCartUpdate = (callback: (data: CartUpdateMessage) => void) => {
  try {
    const channel = getBroadcastChannel();
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CART_UPDATE') {
        callback(event.data.payload);
      }
    };
    channel.addEventListener('message', handleMessage);
    return () => channel.removeEventListener('message', handleMessage);
  } catch (error) {
    console.warn('BroadcastChannel no soportado:', error);
    return () => {};
  }
};

/**
 * Cerrar el canal
 */
export const closeBroadcastChannel = () => {
  if (broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
  }
};
