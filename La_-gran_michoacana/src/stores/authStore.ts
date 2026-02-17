import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usePermissionsStore } from './permissionsStore';
import { apiClient } from '../lib/apiClient';

interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: 'ADMIN' | 'CAJERO' | 'GERENTE';
}

interface AuthResponse {
  status: string;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.post<AuthResponse>('/auth/login', {
            username,
            password,
          });

          const { user, accessToken, refreshToken } = response.data;

          // Guardar tokens
          localStorage.setItem('auth_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
          apiClient.setToken(accessToken);

          // Normalizar rol (backend ya lo envía en minúsculas)
          const normalizedRole = user.role.toLowerCase() as 'admin' | 'cajero' | 'gerente';

          set({
            user: { ...user, role: user.role as any },
            isAuthenticated: true,
            accessToken,
            refreshToken,
            isLoading: false,
          });

          // Inicializar permisos del usuario
          usePermissionsStore.getState().initializeUserPermissions(
            username,
            normalizedRole
          );

          return true;
        } catch (error: any) {
          const errorMessage = error.data?.message || error.message || 'Error en el login';
          set({
            isLoading: false,
            error: errorMessage,
            user: null,
            isAuthenticated: false,
          });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        apiClient.clearToken();
        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        // Restaurar token después de hidratar desde localStorage
        if (state?.accessToken) {
          apiClient.setToken(state.accessToken);
          
          // Reinicializar permisos si el usuario está logueado
          if (state?.user) {
            const normalizedRole = state.user.role.toLowerCase() as 'admin' | 'cajero' | 'gerente';
            usePermissionsStore.getState().initializeUserPermissions(
              state.user.username,
              normalizedRole
            );
          }
        }
      },
    }
  )
);
