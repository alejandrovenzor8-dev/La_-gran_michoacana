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
    const listener = (event: any, data: any) => callback(data);
    ipcRenderer.on('cart:updated', listener);
    
    // Retornar función para desuscribirse
    return () => {
      ipcRenderer.removeListener('cart:updated', listener);
    };
  },
  
  // Escuchar cuando se limpia el carrito
  onCartCleared: (callback: () => void) => {
    const listener = (event: any) => callback();
    ipcRenderer.on('cart:cleared', listener);
    
    // Retornar función para desuscribirse
    return () => {
      ipcRenderer.removeListener('cart:cleared', listener);
    };
  },
  
  // Remover listeners (obsoleto, pero se mantiene para compatibilidad)
  removeCartListeners: () => {
    // Ya no hace nada, los listeners se remueven mediante las funciones retornadas
  },
});

// Type definitions para TypeScript
export interface ElectronAPI {
  updateCart: (data: any) => void;
  clearCart: () => void;
  getCart: () => Promise<any>;
  onCartUpdated: (callback: (data: any) => void) => () => void;
  onCartCleared: (callback: () => void) => () => void;
  removeCartListeners: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
