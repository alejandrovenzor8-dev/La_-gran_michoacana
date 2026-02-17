/**
 * Store de autenticación con Zustand
 * Adaptado para React Native con AsyncStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient } from '../api/client';
import { storage } from '../utils/storage';
import type { User, AuthResponse } from '../types';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      /**
       * Login
       */
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post<AuthResponse>('/auth/login', {
            username,
            password,
          });

          const { user, accessToken, refreshToken } = response.data;

          // Guardar token en el cliente
          await apiClient.setToken(accessToken);

          set({
            user,
            isAuthenticated: true,
            accessToken,
            refreshToken,
            isLoading: false,
            error: null,
          });

          console.log(`✅ Login exitoso: ${username} (${user.role})`);
          return true;
        } catch (error: any) {
          const errorMessage = error.data?.message || error.message || 'Error en el login';
          set({
            isLoading: false,
            error: errorMessage,
            user: null,
            isAuthenticated: false,
          });
          console.error(`❌ Error en login:`, errorMessage);
          return false;
        }
      },

      /**
       * Logout
       */
      logout: async () => {
        await apiClient.clearToken();
        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          error: null,
        });
        console.log('🚪 Sesión cerrada');
      },

      /**
       * Limpiar error
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Inicializar (restaurar token)
       */
      initialize: async () => {
        const state = get();
        if (state.accessToken) {
          await apiClient.setToken(state.accessToken);
          console.log('🔑 Token restaurado desde AsyncStorage');
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          const value = await storage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await storage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await storage.removeItem(name);
        },
      })),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
