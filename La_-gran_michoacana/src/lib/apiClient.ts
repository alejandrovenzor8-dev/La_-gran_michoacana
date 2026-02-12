/**
 * Configuración de la API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 10000,
};

/**
 * Cliente HTTP genérico para hacer peticiones a la API
 */
export class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  /**
   * Carga el token del localStorage
   */
  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  /**
   * Establece el token para futuras peticiones
   */
  public setToken(token: string) {
    this.token = token;
  }

  /**
   * Limpia el token
   */
  public clearToken() {
    this.token = null;
  }

  /**
   * Método genérico GET
   */
  public async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  /**
   * Método genérico POST
   */
  public async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  /**
   * Método genérico PUT
   */
  public async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  /**
   * Método genérico DELETE
   */
  public async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  /**
   * Obtiene los headers comunes
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Maneja la respuesta HTTP
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();

    if (!response.ok) {
      const error = new Error((data as any).message || 'Error en la API');
      (error as any).status = response.status;
      (error as any).data = data;
      throw error;
    }

    return data;
  }
}

// Instancia global del cliente
export const apiClient = new ApiClient(API_CONFIG.baseURL);
