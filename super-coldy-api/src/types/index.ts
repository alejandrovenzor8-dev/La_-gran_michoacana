// Tipos e interfaces globales

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthPayload {
  id: string;
  email: string;
  role: string;
}
