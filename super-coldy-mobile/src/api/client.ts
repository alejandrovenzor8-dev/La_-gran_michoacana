/**
 * Cliente HTTP para peticiones a la API
 * Adaptado para React Native con AsyncStorage
 */

import { API_CONFIG } from '../config/api.config';
import { storage } from '../utils/storage';

export class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private tokenPromise: Promise<void>;

  constructor(baseURL = API_CONFIG.baseURL) {
    this.baseURL = baseURL;
    this.tokenPromise = this.loadToken();
  }

  /**
   * Carga el token de AsyncStorage
   */
  private async loadToken() {
    try {
      this.token = await storage.getItem('auth_token');
      if (this.token) {
        console.log('🔑 Token loaded from AsyncStorage');
      }
    } catch (error) {
      console.error('Error loading token from AsyncStorage:', error);
      this.token = null;
    }
  }

  /**
   * Asegura que el token haya sido cargado antes de hacer una petición
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
    console.log('🔑 Token saved to AsyncStorage');
  }

  /**
   * Limpia el token
   */
  public async clearToken() {
    this.token = null;
    await storage.removeItem('auth_token');
    console.log('🔓 Token removed from AsyncStorage');
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
    const text = await response.text();
    let data: any;

    try {
      data = text ? JSON.parse(text) : {};
    } catch (error) {
      console.error('Error parsing JSON:', text);
      throw new Error('Invalid JSON response from server');
    }

    if (!response.ok) {
      const error = new Error(data.message || `HTTP ${response.status}`);
      (error as any).status = response.status;
      (error as any).data = data;
      throw error;
    }

    return data;
  }

  /**
   * GET request
   */
  public async get<T>(endpoint: string): Promise<T> {
    await this.ensureTokenLoaded();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  public async post<T>(endpoint: string, data: unknown): Promise<T> {
    await this.ensureTokenLoaded();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  /**
   * PUT request
   */
  public async put<T>(endpoint: string, data: unknown): Promise<T> {
    await this.ensureTokenLoaded();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  public async delete<T>(endpoint: string): Promise<T> {
    await this.ensureTokenLoaded();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }
}

// Instancia global del cliente
export const apiClient = new ApiClient();
