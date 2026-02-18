import { apiClient } from './client';
import type { Product, ApiResponse } from '../types';

class ProductService {
  /**
   * Obtener todos los productos
   */
  async getAllProducts(filters?: {
    category?: string;
    active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Product[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.active !== undefined) params.append('active', String(filters.active));
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const queryString = params.toString();
      const endpoint = `/products${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<ApiResponse<{ products: Product[] }>>(endpoint);
      
      // Asegurar que todos los productos tengan valores por defecto
      const products = (response.data.products || []).map(p => ({
        ...p,
        price: p.price ?? 0,
        cost: p.cost ?? 0,
        stock: p.stock ?? 0,
        minStock: p.minStock ?? 0,
      }));
      
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  /**
   * Obtener producto por ID
   */
  async getProductById(id: number): Promise<Product | null> {
    try {
      const response = await apiClient.get<ApiResponse<{ product: Product }>>(`/products/${id}`);
      const product = response.data.product;
      if (!product) return null;
      
      return {
        ...product,
        price: product.price ?? 0,
        cost: product.cost ?? 0,
        stock: product.stock ?? 0,
        minStock: product.minStock ?? 0,
      };
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      return null;
    }
  }

  /**
   * Crear nuevo producto
   */
  async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product | null> {
    try {
      const response = await apiClient.post<ApiResponse<{ product: Product }>>('/products', data);
      return response.data.product || null;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Actualizar producto
   */
  async updateProduct(
    id: number,
    data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Product | null> {
    try {
      const response = await apiClient.put<ApiResponse<{ product: Product }>>(`/products/${id}`, data);
      return response.data.product || null;
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar producto
   */
  async deleteProduct(id: number): Promise<boolean> {
    try {
      await apiClient.delete<ApiResponse<null>>(`/products/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtener categorías
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ categories: string[] }>>('/products/categories');
      return response.data.categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Obtener estadísticas de productos
   */
  async getProductStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/products/stats');
      const data = response.data;
      return {
        total: data.totalProducts || 0,
        active: data.activeProducts || 0,
        inactive: data.inactiveProducts || 0,
        lowStock: data.lowStockCount || 0,
        outOfStock: data.outOfStockCount || 0,
        totalValue: data.inventoryValue || 0,
      };
    } catch (error) {
      console.error('Error fetching product stats:', error);
      // Retornar valores por defecto en lugar de fallar
      return {
        total: 0,
        active: 0,
        inactive: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0,
      };
    }
  }

  /**
   * Buscar productos
   */
  async searchProducts(query: string): Promise<Product[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ products: Product[] }>>(`/products/search?q=${query}`);
      
      const products = (response.data.products || []).map(p => ({
        ...p,
        price: p.price ?? 0,
        cost: p.cost ?? 0,
        stock: p.stock ?? 0,
        minStock: p.minStock ?? 0,
      }));
      
      return products;
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }
}

export const productService = new ProductService();
