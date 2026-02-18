/**
 * Store de autenticación con Zustand
 * Adaptado para React Native con AsyncStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient } from '../api/client';
import { authService } from '../api/authService';
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
  refreshAccessToken: () => Promise<boolean>;
  clearError: () => void;
  initialize: () => Promise<void>;
  updateProfile: (user: User) => void;
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
          const response = await authService.login(username, password);
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
       * Refrescar token de acceso
       */
      refreshAccessToken: async () => {
        const state = get();
        if (!state.refreshToken) {
          console.warn('⚠️ No refresh token available');
          return false;
        }

        try {
          const { accessToken, refreshToken } = await authService.refreshToken(state.refreshToken);
          await apiClient.setToken(accessToken);

          set({
            accessToken,
            refreshToken,
            error: null,
          });

          console.log('✅ Token refrescado exitosamente');
          return true;
        } catch (error: any) {
          console.error('❌ Error refrescando token:', error);
          // Si falla el refresh, hacer logout
          await get().logout();
          return false;
        }
      },

      /**
       * Logout
       */
      logout: async () => {
        try {
          // Intentar logout en el servidor
          await authService.logout();
        } catch (error) {
          console.error('Error en logout en servidor:', error);
          // Continuar con logout local igualmente
        }

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
       * Actualizar perfil del usuario
       */
      updateProfile: (user: User) => {
        set({ user });
      },

      /**
       * Inicializar (restaurar token)
       */
      initialize: async () => {
        const state = get();
        if (state.accessToken) {
          await apiClient.setToken(state.accessToken);
          // Verificar si el token sigue siendo válido
          const isValid = await authService.verifyToken();
          if (!isValid && state.refreshToken) {
            console.log('🔄 Token expirado, intentando refrescar...');
            await get().refreshAccessToken();
          } else if (!isValid) {
            console.log('❌ Token inválido y no hay refresh token');
            await get().logout();
          } else {
            console.log('🔑 Token restaurado y validado desde AsyncStorage');
          }
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
