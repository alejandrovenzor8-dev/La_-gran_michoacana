// Sistema de eventos global para comunicación inter-pantalla
type EventListener = (data: any) => void;

const listeners: { [key: string]: EventListener[] } = {};

export const eventBus = {
  on: (event: string, callback: EventListener) => {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(callback);

    // Retornar función para desuscribirse
    return () => {
      listeners[event] = listeners[event].filter(cb => cb !== callback);
    };
  },

  emit: (event: string, data: any) => {
    // Primero disparar evento personalizado en el DOM (para Electron IPC)
    window.dispatchEvent(
      new CustomEvent(event, { detail: data })
    );

    // También llamar listeners locales
    if (listeners[event]) {
      listeners[event].forEach(callback => callback(data));
    }

    // Guardar en localStorage para compatibilidad con ventanas separadas
    try {
      localStorage.setItem(`__event__${event}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      // Error writing to localStorage
    }
  },

  off: (event: string, callback: EventListener) => {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  }
};

// Escuchar cambios en localStorage de otros procesos
window.addEventListener('storage', (e: StorageEvent) => {
  if (e.key?.startsWith('__event__')) {
    const eventName = e.key.replace('__event__', '');
    try {
      const value = JSON.parse(e.newValue || '{}');
      // Importante: no volver a emitir con eventBus.emit para evitar
      // reescribir localStorage y crear un bucle entre ventanas.
      window.dispatchEvent(new CustomEvent(eventName, { detail: value.data }));
      if (listeners[eventName]) {
        listeners[eventName].forEach(callback => callback(value.data));
      }
    } catch (err) {
      // Error parsing event from storage
    }
  }
});
