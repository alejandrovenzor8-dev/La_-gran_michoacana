import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { broadcastCartUpdate } from '@/lib/broadcastSync';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  toppings?: string[];
  notes?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existingItem = items.find((item) => item.product.id === product.id);

        if (existingItem) {
          const newItems = items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
          set({ items: newItems });
          broadcastCartUpdate({ items: newItems, total: get().getTotal() });
        } else {
          const newItems = [...items, { product, quantity, toppings: [] }];
          set({ items: newItems });
          broadcastCartUpdate({ items: newItems, total: get().getTotal() });
        }
      },

      removeItem: (productId) => {
        const newItems = get().items.filter((item) => item.product.id !== productId);
        set({ items: newItems });
        broadcastCartUpdate({ items: newItems, total: get().getTotal() });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const newItems = get().items.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        );
        set({ items: newItems });
        broadcastCartUpdate({ items: newItems, total: get().getTotal() });
      },

      clearCart: () => {
        set({ items: [] });
        broadcastCartUpdate({ items: [], total: 0 });
      },

      getTotal: () => {
        return get().items.reduce((total, item) => total + item.product.price * item.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
