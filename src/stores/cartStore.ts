import { create } from 'zustand';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  emoji?: string;
  category?: string;
}

interface CartStore {
  items: CartItem[];
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setCart: (items: CartItem[]) => void;
}

const isElectron = typeof window !== 'undefined' && window.electronAPI;

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  total: 0,

  addItem: (item) => {
    set((state) => {
      const existingItem = state.items.find((i) => i.id === item.id);
      let newItems: CartItem[];

      if (existingItem) {
        newItems = state.items.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        newItems = [...state.items, item];
      }

      const newTotal = newItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      // Sincronizar con Electron
      if (isElectron) {
        window.electronAPI.updateCart({ items: newItems, total: newTotal });
      }

      return { items: newItems, total: newTotal };
    });
  },

  removeItem: (id) => {
    set((state) => {
      const newItems = state.items.filter((i) => i.id !== id);
      const newTotal = newItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      if (isElectron) {
        window.electronAPI.updateCart({ items: newItems, total: newTotal });
      }

      return { items: newItems, total: newTotal };
    });
  },

  updateQuantity: (id, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return get().removeItem(id) as any;
      }

      const newItems = state.items.map((i) =>
        i.id === id ? { ...i, quantity } : i
      );
      const newTotal = newItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      if (isElectron) {
        window.electronAPI.updateCart({ items: newItems, total: newTotal });
      }

      return { items: newItems, total: newTotal };
    });
  },

  clearCart: () => {
    set({ items: [], total: 0 });
    
    // Sincronizar con Electron
    if (isElectron) {
      window.electronAPI.clearCart();
    }
  },

  setCart: (items) => {
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    set({ items, total });
    
    // Sincronizar con Electron
    if (isElectron) {
      window.electronAPI.updateCart({ items, total });
    }
  },
}));
