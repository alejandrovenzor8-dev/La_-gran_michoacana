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

  // Abrir caja registradora
  openCashDrawer: async (portConfig?: { port: string }) => {
    return await ipcRenderer.invoke('cashDrawer:open', portConfig);
  },

  // Cerrar la aplicación completamente
  closeApp: () => {
    ipcRenderer.send('app:close');
  },

  // ============================================================
  // SISTEMA DE AUTO-ACTUALIZACIÓN
  // ============================================================
  
  // Verificar si hay actualizaciones disponibles
  checkForUpdates: () => {
    ipcRenderer.send('check-for-updates');
  },
  
  // Descargar actualización
  downloadUpdate: () => {
    ipcRenderer.send('download-update');
  },
  
  // Instalar actualización y reiniciar
  installUpdate: () => {
    ipcRenderer.send('install-update');
  },
  
  // Escuchar estado de actualización
  onUpdateStatus: (callback: (status: string, data?: any) => void) => {
    const listener = (event: any, info: { status: string; data?: any }) => {
      callback(info.status, info.data);
    };
    ipcRenderer.on('update-status', listener);
    
    return () => {
      ipcRenderer.removeListener('update-status', listener);
    };
  },
  
  // ============================================================
  // GESTIÓN DE IMÁGENES LOCALES
  // ============================================================
  
  // Guardar imagen en el sistema de archivos local
  saveImage: async (base64Data: string) => {
    return await ipcRenderer.invoke('image:save', base64Data);
  },
  
  // Obtener ruta absoluta de una imagen
  getImagePath: async (relativePath: string) => {
    return await ipcRenderer.invoke('image:getPath', relativePath);
  },

  // Obtener ruta del logo (como file:// URL)
  getLogoPath: async () => {
    return await ipcRenderer.invoke('asset:getLogoPath');
  },
  
  // Eliminar imagen del sistema de archivos
  deleteImage: async (relativePath: string) => {
    return await ipcRenderer.invoke('image:delete', relativePath);
  },
  
  // Escuchar cuando hay actualización disponible
  onUpdateAvailable: (callback: (info: any) => void) => {
    const listener = (event: any, info: any) => callback(info);
    ipcRenderer.on('update-available', listener);
    return () => ipcRenderer.removeListener('update-available', listener);
  },
  
  // Escuchar progreso de descarga
  onDownloadProgress: (callback: (progress: any) => void) => {
    const listener = (event: any, progress: any) => callback(progress);
    ipcRenderer.on('download-progress', listener);
    return () => ipcRenderer.removeListener('download-progress', listener);
  },
  
  // Escuchar cuando la actualización fue descargada
  onUpdateDownloaded: (callback: (info: any) => void) => {
    const listener = (event: any, info: any) => callback(info);
    ipcRenderer.on('update-downloaded', listener);
    return () => ipcRenderer.removeListener('update-downloaded', listener);
  },

  // Escuchar errores de actualización
  onUpdateError: (callback: (error: any) => void) => {
    const listener = (event: any, error: any) => callback(error);
    ipcRenderer.on('update-error', listener);
    return () => ipcRenderer.removeListener('update-error', listener);
  },

  // Escuchar cuando no hay actualizaciones disponibles
  onUpdateNotAvailable: (callback: () => void) => {
    const listener = (event: any) => callback();
    ipcRenderer.on('update-not-available', listener);
    return () => ipcRenderer.removeListener('update-not-available', listener);
  },

  // ============================================================
  // INFORMACIÓN DEL SISTEMA
  // ============================================================
  
  // Obtener arquitectura del sistema (ia32 o x64)
  getSystemArchitecture: () => {
    return process.arch;
  },

  // Verificar si es sistema 32-bit
  is32Bit: () => {
    return process.arch === 'ia32';
  },

  // Verificar si es sistema 64-bit
  is64Bit: () => {
    return process.arch === 'x64';
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
  closeApp: () => void;
  
  // Auto-actualización
  checkForUpdates: () => void;
  downloadUpdate: () => void;
  installUpdate: () => void;
  onUpdateStatus: (callback: (status: string, data?: any) => void) => () => void;
  onUpdateAvailable: (callback: (info: any) => void) => () => void;
  onDownloadProgress: (callback: (progress: any) => void) => () => void;
  onUpdateDownloaded: (callback: (info: any) => void) => () => void;
  onUpdateError: (callback: (error: any) => void) => () => void;
  onUpdateNotAvailable: (callback: () => void) => () => void;
  
  // Gestión de activos
  getLogoPath: () => Promise<{ success: boolean; path?: string; error?: string }>;
  
  // Sistema
  getSystemArchitecture: () => string;
  is32Bit: () => boolean;
  is64Bit: () => boolean;

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
