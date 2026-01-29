/**
 * Utilidades para manejar la pantalla del cliente
 */

export interface CustomerDisplayOptions {
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  fullscreen?: boolean;
}

const DEFAULT_OPTIONS: Required<Omit<CustomerDisplayOptions, 'fullscreen'>> = {
  width: 1024,
  height: 768,
  left: 0,
  top: 0,
};

/**
 * Abre la pantalla del cliente en una nueva ventana
 */
export const openCustomerDisplay = (options?: CustomerDisplayOptions): Window | null => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Si fullscreen está habilitado, ignorar dimensiones
  const windowFeatures = options?.fullscreen
    ? 'fullscreen=yes'
    : `width=${config.width},height=${config.height},left=${config.left},top=${config.top},resizable=yes,menubar=no,toolbar=no,location=no,status=yes`;

  try {
    const newWindow = window.open(
      '/customer-display',
      'customer-display-window',
      windowFeatures
    );

    if (!newWindow) {
      throw new Error('Pop-ups podrían estar bloqueados');
    }

    // Dar foco a la nueva ventana
    newWindow.focus();

    return newWindow;
  } catch (error) {
    console.error('Error al abrir la pantalla del cliente:', error);
    return null;
  }
};

/**
 * Cierra la ventana de cliente de forma segura
 */
export const closeCustomerDisplay = (window: Window | null): void => {
  if (window && !window.closed) {
    try {
      window.close();
    } catch (error) {
      console.error('Error al cerrar la pantalla del cliente:', error);
    }
  }
};

/**
 * Verifica si la ventana de cliente está abierta
 */
export const isCustomerDisplayOpen = (window: Window | null): boolean => {
  return window !== null && !window.closed;
};

/**
 * Calcula la posición ideal para la ventana de cliente (lado derecho del monitor principal)
 */
export const getOptimalCustomerDisplayPosition = (): { left: number; top: number } => {
  return {
    left: window.screenX + window.outerWidth,
    top: window.screenY,
  };
};

/**
 * Abre la pantalla del cliente posicionada automáticamente
 */
export const openCustomerDisplayAutoPositioned = (): Window | null => {
  const position = getOptimalCustomerDisplayPosition();
  return openCustomerDisplay({
    ...position,
    width: 1024,
    height: 768,
  });
};
