import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usePermissionsStore } from './permissionsStore';

interface User {
  username: string;
  role: 'admin' | 'cajero' | 'gerente';
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

// Base de datos simulada de usuarios
const USERS_DB: Record<string, { password: string; role: 'admin' | 'cajero' | 'gerente' }> = {
  admin: {
    password: 'admin123',
    role: 'admin',
  },
  cajero: {
    password: 'cajero123',
    role: 'cajero',
  },
  gerente: {
    password: 'gerente123',
    role: 'gerente',
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (username: string, password: string) => {
        const userCredentials = USERS_DB[username];

        if (userCredentials && userCredentials.password === password) {
          const user: User = {
            username,
            role: userCredentials.role,
          };

          set({
            user,
            isAuthenticated: true,
          });

          // Inicializar permisos del usuario basándose en su rol
          usePermissionsStore.getState().initializeUserPermissions(username, userCredentials.role);
          // Inicializar permisos del usuario si es la primera vez
          const permissionsStore = usePermissionsStore.getState();
          permissionsStore.initializeUserPermissions(username, userCredentials.role);

          console.log(`✅ Login exitoso: ${username} (${userCredentials.role})`);
          return true;
        }

        console.warn(`❌ Intento de login fallido: ${username}`);
        return false;
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
        console.log('🚪 Sesión cerrada');
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
