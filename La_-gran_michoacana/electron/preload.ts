import { contextBridge, ipcRenderer } from 'electron';

// API segura expuesta al renderer (usando 'electronAPI' como nombre global)
contextBridge.exposeInMainWorld('electronAPI', {
  // Notificar login exitoso
  onLoginSuccess: () => {
    return ipcRenderer.invoke('login:success');
  },
  
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

  // Limpiar sesión (localStorage)
  clearSession: () => {
    return ipcRenderer.invoke('clear:session');
  },

  // Cerrar ventanas y volver al login
  logout: () => {
    return ipcRenderer.invoke('logout');
  },

  // Imprimir ticket POS
  printTicket: async (ticketData: any) => {
    return await ipcRenderer.invoke('print-ticket', ticketData);
  },
});

// Type definitions para TypeScript
export interface ElectronAPI {
  onLoginSuccess: () => Promise<{ success: boolean }>;
  updateCart: (data: any) => void;
  clearCart: () => void;
  getCart: () => Promise<any>;
  onCartUpdated: (callback: (data: any) => void) => () => void;
  onCartCleared: (callback: () => void) => () => void;
  removeCartListeners: () => void;
  clearSession: () => Promise<{ success: boolean }>;
  logout: () => Promise<{ success: boolean }>;
  printTicket: (ticketData: any) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
