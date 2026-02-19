// Type definitions para la API de Electron expuesta al renderer

export interface ElectronAPI {
  onLoginSuccess: () => Promise<{ success: boolean }>;
  updateCart: (data: any) => void;
  clearCart: () => void;
  getCart: () => Promise<any>;
  onCartUpdated: (callback: (data: any) => void) => void;
  onCartCleared: (callback: () => void) => void;
  removeCartListeners: () => void;
  clearSession: () => Promise<{ success: boolean }>;
  logout: () => Promise<{ success: boolean }>;
  closeApp: () => void;
  
  // Auto-actualización
  checkForUpdates: () => void;
  downloadUpdate: () => void;
  installUpdate: () => void;
  onUpdateStatus: (callback: (status: string, data?: any) => void) => () => void;
  onUpdateAvailable: (callback: (info: any) => void) => () => void;
  onDownloadProgress: (callback: (progress: any) => void) => () => void;
  onUpdateDownloaded: (callback: (info: any) => void) => () => void;
  
  // Imágenes locales
  saveImage: (base64Data: string) => Promise<{ success: boolean; path?: string; fullPath?: string; error?: string }>;
  getImagePath: (relativePath: string) => Promise<{ success: boolean; path?: string; fullPath?: string; error?: string }>;
  deleteImage: (relativePath: string) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    api?: ElectronAPI;
  }
}
