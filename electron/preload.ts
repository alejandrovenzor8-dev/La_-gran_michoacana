import { contextBridge, ipcRenderer } from 'electron';

// API segura expuesta al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Enviar actualización del carrito
  updateCart: (data: any) => {
    ipcRenderer.send('cart:update', data);
  },
  
  // Limpiar carrito
  clearCart: () => {
    ipcRenderer.send('cart:clear');
  },
  
  // Obtener estado del carrito
  getCart: () => {
    return ipcRenderer.invoke('cart:get');
  },
  
  // Escuchar actualizaciones del carrito (para pantalla cliente)
  onCartUpdated: (callback: (data: any) => void) => {
    ipcRenderer.on('cart:updated', (event, data) => callback(data));
  },
  
  // Escuchar cuando se limpia el carrito
  onCartCleared: (callback: () => void) => {
    ipcRenderer.on('cart:cleared', callback);
  },
  
  // Remover listeners
  removeCartListeners: () => {
    ipcRenderer.removeAllListeners('cart:updated');
    ipcRenderer.removeAllListeners('cart:cleared');
  },
});

// Type definitions para TypeScript
export interface ElectronAPI {
  updateCart: (data: any) => void;
  clearCart: () => void;
  getCart: () => Promise<any>;
  onCartUpdated: (callback: (data: any) => void) => void;
  onCartCleared: (callback: () => void) => void;
  removeCartListeners: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
