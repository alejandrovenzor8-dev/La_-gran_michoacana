// Type definitions para la API de Electron expuesta al renderer

interface SystemResources {
  totalMemoryGB: number;
  freeMemoryGB: number;
  cpuCount: number;
  arch: string;
  platform: string;
  cpuModel: string;
  shouldUseBasicMode: boolean;
  is32Bit: boolean;
  isLowMemory: boolean;
  isLowCPU: boolean;
}

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
  
  // Imágenes locales
  saveImage: (base64Data: string) => Promise<{ success: boolean; path?: string; fullPath?: string; error?: string }>;
  getImagePath: (relativePath: string) => Promise<{ success: boolean; path?: string; fullPath?: string; error?: string }>;
  deleteImage: (relativePath: string) => Promise<{ success: boolean; error?: string }>;
  
  // Sistema de detección de recursos y rendimiento
  getSystemResources: () => Promise<{ 
    success: boolean; 
    resources?: SystemResources;
    error?: string;
  }>;
  savePerformanceConfig: (config: { useBasicMode: boolean }) => Promise<{ success: boolean; error?: string }>;
  loadPerformanceConfig: () => Promise<{ success: boolean; config?: { useBasicMode: boolean } | null; error?: string }>;

  // Impresión y configuración de impresoras
  printTicket: (ticketData: any) => Promise<{ success: boolean; error?: string }>;
  getPrinters: () => Promise<Array<{ name: string; displayName: string; isDefault?: boolean }>>;
  savePrinter: (printerName: string, branchId: number) => Promise<{ success: boolean; error?: string }>;
  getSavedPrinter: (branchId: number) => Promise<{ printerName: string | null }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    api?: ElectronAPI;
  }
}
