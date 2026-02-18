import { apiClient } from './client';
import type { User, AuthResponse, ApiResponse } from '../types';

class AuthService {
  /**
   * Login
   */
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        username,
        password,
      });
      return response;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  /**
   * Registrar nuevo usuario (si está autorizado)
   */
  async register(data: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
  }): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      return response;
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }

  /**
   * Refrescar token de acceso
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const response = await apiClient.post<
        ApiResponse<{
          accessToken: string;
          refreshToken: string;
        }>
      >('/auth/refresh', { refreshToken });
      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Logout del servidor
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      console.error('Error during logout:', error);
      // No lanzar error aquí, el logout local se ejecutará de todas formas
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<boolean> {
    try {
      await apiClient.post('/auth/change-password', data);
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Solicitar reset de contraseña
   */
  async requestPasswordReset(email: string): Promise<boolean> {
    try {
      await apiClient.post('/auth/forgot-password', { email });
      return true;
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw error;
    }
  }

  /**
   * Reset de contraseña con token
   */
  async resetPassword(data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<boolean> {
    try {
      await apiClient.post('/auth/reset-password', data);
      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Obtener perfil del usuario actual
   */
  async getProfile(): Promise<User | null> {
    try {
      const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/profile');
      return response.data.user;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(data: {
    email?: string;
    fullName?: string;
  }): Promise<User | null> {
    try {
      const response = await apiClient.put<ApiResponse<{ user: User }>>('/auth/profile', data);
      return response.data.user;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Verificar si el token es válido
   */
  async verifyToken(): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ valid: boolean }>>('/auth/verify');
      return response.data.valid || false;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  }
}

export const authService = new AuthService();
