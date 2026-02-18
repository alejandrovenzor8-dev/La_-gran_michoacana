/**
 * Cliente HTTP mejorado para peticiones a la API
 * Características:
 * - Retry automático con backoff exponencial
 * - Timeout configurable
 * - Mejor manejo de errores
 * - Logging detallado
 */

import { API_CONFIG } from '../config/api.config';
import { storage } from '../utils/storage';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

interface NetworkError extends Error {
  status?: number;
  data?: any;
  originalError?: Error;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 segundo
  maxDelay: 10000, // 10 segundos
};

export class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private tokenPromise: Promise<void>;
  private timeout: number;
  private retryConfig: RetryConfig;

  constructor(
    baseURL = API_CONFIG.baseURL,
    timeout = API_CONFIG.timeout,
    retryConfig = DEFAULT_RETRY_CONFIG
  ) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.retryConfig = retryConfig;
    this.tokenPromise = this.loadToken();
  }

  /**
   * Carga el token de AsyncStorage
   */
  private async loadToken() {
    try {
      this.token = await storage.getItem('auth_token');
      if (this.token) {
        console.log('🔑 Token cargado desde AsyncStorage');
      }
    } catch (error) {
      console.error('Error cargando token:', error);
      this.token = null;
    }
  }

  /**
   * Asegura que el token haya sido cargado
   */
  private async ensureTokenLoaded() {
    await this.tokenPromise;
  }

  /**
   * Establece el token para futuras peticiones
   */
  public async setToken(token: string) {
    this.token = token;
    await storage.setItem('auth_token', token);
    console.log('🔑 Token guardado en AsyncStorage');
  }

  /**
   * Limpia el token
   */
  public async clearToken() {
    this.token = null;
    await storage.removeItem('auth_token');
    console.log('🔓 Token removido de AsyncStorage');
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
   * Calcula el delay con backoff exponencial
   */
  private getBackoffDelay(attempt: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, attempt),
      this.retryConfig.maxDelay
    );
    // Añadir jitter para evitar thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Determina si un error es retryable
   */
  private isRetryableError(error: any, status?: number): boolean {
    // Retryar en errores de red, timeouts y algunos códigos HTTP
    if (!error) return false;
    if (error.name === 'AbortError') return true; // Timeout
    if (status === 408) return true; // Request Timeout
    if (status === 429) return true; // Too Many Requests
    if (status === 500) return true; // Internal Server Error
    if (status === 502) return true; // Bad Gateway
    if (status === 503) return true; // Service Unavailable
    if (status === 504) return true; // Gateway Timeout
    return false;
  }

  /**
   * Espera con timeout
   */
  private createTimeoutPromise<T>(): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        const error = new Error('Network request timeout');
        (error as NetworkError).status = 408;
        reject(error);
      }, this.timeout);
    });
  }

  /**
   * Realiza una petición con retry automático
   */
  private async fetchWithRetry<T>(
    endpoint: string,
    init: RequestInit
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        console.log(`📡 ${init.method || 'GET'} ${endpoint} (intento ${attempt + 1})`);

        const racePromises: Promise<Response>[] = [
          fetch(`${this.baseURL}${endpoint}`, init),
        ];

        // Agregar timeout
        racePromises.push(this.createTimeoutPromise());

        const response = await Promise.race(racePromises);
        return await this.handleResponse<T>(response);
      } catch (error: any) {
        lastError = error;
        const status = error.status;

        console.warn(
          `⚠️ Petición fallida (${init.method || 'GET'} ${endpoint}): ${error.message}`
        );

        // Si es el último intento o no es retryable, lanzar error
        if (attempt === this.retryConfig.maxRetries || !this.isRetryableError(error, status)) {
          console.error(`❌ Error final en ${endpoint}:`, error);
          throw error;
        }

        // Esperar antes de reintentar
        const delay = this.getBackoffDelay(attempt);
        console.log(`⏳ Esperando ${Math.round(delay)}ms antes de reintentar...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Maneja la respuesta HTTP
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const text = await response.text();
    let data: any;

    try {
      data = text ? JSON.parse(text) : {};
    } catch (error) {
      console.error('❌ Error parseando JSON:', text);
      const err = new Error('Respuesta inválida del servidor');
      (err as NetworkError).status = response.status;
      throw err;
    }

    if (!response.ok) {
      const error = new Error(data.message || `HTTP ${response.status}`);
      (error as NetworkError).status = response.status;
      (error as NetworkError).data = data;
      throw error;
    }

    console.log(`✅ Respuesta exitosa: ${response.status}`);
    return data;
  }

  /**
   * GET request
   */
  public async get<T>(endpoint: string): Promise<T> {
    await this.ensureTokenLoaded();
    return this.fetchWithRetry<T>(endpoint, {
      method: 'GET',
      headers: this.getHeaders(),
    });
  }

  /**
   * POST request
   */
  public async post<T>(endpoint: string, data: unknown): Promise<T> {
    await this.ensureTokenLoaded();
    return this.fetchWithRetry<T>(endpoint, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  public async put<T>(endpoint: string, data: unknown): Promise<T> {
    await this.ensureTokenLoaded();
    return this.fetchWithRetry<T>(endpoint, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  public async delete<T>(endpoint: string): Promise<T> {
    await this.ensureTokenLoaded();
    return this.fetchWithRetry<T>(endpoint, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  /**
   * PATCH request
   */
  public async patch<T>(endpoint: string, data: unknown): Promise<T> {
    await this.ensureTokenLoaded();
    return this.fetchWithRetry<T>(endpoint, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
  }
}

// Instancia global del cliente
export const apiClient = new ApiClient();
