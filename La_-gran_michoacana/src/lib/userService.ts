import { apiClient } from './apiClient';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  role: 'admin' | 'cajero' | 'gerente';
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
  role: 'admin' | 'cajero' | 'gerente';
}

export interface UpdateUserData {
  email?: string;
  fullName?: string;
  role?: 'admin' | 'cajero' | 'gerente';
  active?: boolean;
  timezone?: string;
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
      const response = await apiClient.post<CreateUserResponse>('/auth/register', data);
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
      const response = await apiClient.put<UpdateUserResponse>(
        `/users/${userId}`,
        data
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
}

// Instancia singleton del servicio
export const userService = new UserService();
