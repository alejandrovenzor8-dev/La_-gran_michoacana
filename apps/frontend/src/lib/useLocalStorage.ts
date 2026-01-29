import { useEffect } from 'zustand';

// Hook para sincronizar el carrito con localStorage
export const useLocalStorage = (key: string) => {
  const setItem = (value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Disparar evento para otras ventanas/tabs
      window.dispatchEvent(
        new StorageEvent('storage', {
          key,
          newValue: JSON.stringify(value),
          storageArea: localStorage,
        })
      );
    } catch (error) {
      console.error(`Error saving to localStorage:`, error);
    }
  };

  const getItem = () => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage:`, error);
      return null;
    }
  };

  const removeItem = () => {
    localStorage.removeItem(key);
  };

  return { setItem, getItem, removeItem };
};
