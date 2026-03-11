/**
 * Configuración de la API
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://la-granmichoacana-production.up.railway.app/api';

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

  private async request<T>(endpoint: string, init: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), API_CONFIG.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...init,
        signal: controller.signal,
      });
      return await this.handleResponse<T>(response);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        const timeoutError = new Error('La solicitud excedio el tiempo de espera');
        (timeoutError as any).status = 408;
        (timeoutError as any).code = 'REQUEST_TIMEOUT';
        throw timeoutError;
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
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
    return this.request<T>(endpoint, {
      method: 'GET',
      headers: this.getHeaders(),
    });
  }

  /**
   * Método genérico POST
   */
  public async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
  }

  /**
   * Método genérico PUT
   */
  public async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
  }

  /**
   * Método genérico PATCH
   */
  public async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
  }

  /**
   * Método genérico DELETE
   */
  public async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
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
    const rawText = await response.text();
    const data = rawText ? JSON.parse(rawText) : {};

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
