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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
