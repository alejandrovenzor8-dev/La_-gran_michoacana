import { apiClient } from './apiClient';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  role: 'ADMIN' | 'CAJERO' | 'GERENTE';
  branchId: number | null;
  branch?: {
    id: number;
    name: string;
  } | null;
  active: boolean;
  timezone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role: 'ADMIN' | 'CAJERO' | 'GERENTE';
  branchId?: number;
}

export interface UpdateUserData {
  email?: string;
  fullName?: string;
  role?: 'ADMIN' | 'CAJERO' | 'GERENTE';
  active?: boolean;
  timezone?: string;
  branchId?: number | null;
}

interface GetUsersResponse {
  status: string;
  data: {
    users: User[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      pages: number;
    };
  };
}

interface GetUserResponse {
  status: string;
  data: {
    user: User;
  };
}

interface CreateUserResponse {
  status: string;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

interface UpdateUserResponse {
  status: string;
  message: string;
  data: {
    user: User;
  };
}

interface DeleteUserResponse {
  status: string;
  message: string;
}

/**
 * Servicio de usuarios
 * Maneja todas las operaciones HTTP relacionadas con usuarios
 */
class UserService {
  /**
   * Obtener lista de usuarios
   * @param limit - Límite de resultados
   * @param offset - Offset para paginación
   */
  async getUsers(limit: number = 10, offset: number = 0): Promise<User[]> {
    try {
      const response = await apiClient.get<GetUsersResponse>(
        `/users?limit=${limit}&offset=${offset}`
      );
      return response.data.users;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener usuario por ID
   * @param userId - ID del usuario
   */
  async getUserById(userId: number): Promise<User> {
    try {
      const response = await apiClient.get<GetUserResponse>(`/users/${userId}`);
      return response.data.user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crear nuevo usuario
   * @param data - Datos del nuevo usuario
   */
  async createUser(data: CreateUserData): Promise<User> {
    try {
      const payload = {
        ...data,
        role: data.role.toLowerCase(), // Convertir a minúsculas para el backend
      };
      const response = await apiClient.post<CreateUserResponse>('/auth/register', payload);
      return response.data.user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar usuario
   * @param userId - ID del usuario
   * @param data - Datos a actualizar
   */
  async updateUser(userId: number, data: UpdateUserData): Promise<User> {
    try {
      const payload = {
        ...data,
        role: data.role ? data.role.toUpperCase() : data.role, // Normalizar role a MAYÚSCULAS
      };
      const response = await apiClient.put<UpdateUserResponse>(
        `/users/${userId}`,
        payload
      );
      return response.data.user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar usuario
   * @param userId - ID del usuario a eliminar
   */
  async deleteUser(userId: number): Promise<void> {
    try {
      await apiClient.delete<DeleteUserResponse>(`/users/${userId}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cambiar contraseña del usuario actual
   * @param currentPassword - Contraseña actual
   * @param newPassword - Nueva contraseña
   */
  async changeOwnPassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const response = await apiClient.post<{ status: string; message: string }>(
        '/auth/change-password',
        {
          currentPassword,
          newPassword,
        }
      );
      return response.status === 200;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cambiar contraseña de otro usuario (solo admin)
   * @param userId - ID del usuario
   * @param newPassword - Nueva contraseña
   */
  async changeUserPassword(userId: number, newPassword: string): Promise<User> {
    try {
      const response = await apiClient.post<UpdateUserResponse>(
        `/users/${userId}/change-password`,
        {
          newPassword,
        }
      );
      return response.data.user;
    } catch (error) {
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const userService = new UserService();
