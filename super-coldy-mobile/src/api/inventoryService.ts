import { apiClient } from './client';
import type { Product, ApiResponse, InventoryMovement } from '../types';

class InventoryService {
  /**
   * Obtener movimientos de inventario
   */
  async getMovements(filters?: {
    startDate?: Date;
    endDate?: Date;
    productId?: number;
    type?: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'VENTA';
    page?: number;
    limit?: number;
  }): Promise<{ movements: InventoryMovement[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters?.productId) params.append('productId', String(filters.productId));
      if (filters?.type) params.append('type', filters.type);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const queryString = params.toString();
      const endpoint = `/inventory/movements${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<
        ApiResponse<{ movements: InventoryMovement[]; pagination: { total: number } }>
      >(endpoint);

      return {
        movements: response.data.movements || [],
        total: response.data.pagination?.total || 0,
      };
    } catch (error) {
      console.error('Error fetching inventory movements:', error);
      return { movements: [], total: 0 };
    }
  }

  /**
   * Registrar entrada de inventario
   */
  async addStock(
    productId: number,
    data: {
      quantity: number;
      reason?: string;
    }
  ): Promise<InventoryMovement | null> {
    try {
      const response = await apiClient.post<ApiResponse<{ movement: InventoryMovement }>>(
        `/inventory/${productId}/add`,
        data
      );
      return response.data.movement;
    } catch (error) {
      console.error(`Error adding stock for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Registrar salida de inventario
   */
  async removeStock(
    productId: number,
    data: {
      quantity: number;
      reason?: string;
    }
  ): Promise<InventoryMovement | null> {
    try {
      const response = await apiClient.post<ApiResponse<{ movement: InventoryMovement }>>(
        `/inventory/${productId}/remove`,
        data
      );
      return response.data.movement;
    } catch (error) {
      console.error(`Error removing stock for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Ajustar inventario
   */
  async adjustStock(
    productId: number,
    data: {
      newQuantity: number;
      reason?: string;
    }
  ): Promise<InventoryMovement | null> {
    try {
      const response = await apiClient.post<ApiResponse<{ movement: InventoryMovement }>>(
        `/inventory/${productId}/adjust`,
        data
      );
      return response.data.movement;
    } catch (error) {
      console.error(`Error adjusting stock for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener productos con bajo stock
   */
  async getLowStockProducts(): Promise<Product[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ products: Product[] }>>(
        '/products/low-stock'
      );
      
      const products = (response.data.products || []).map(p => ({
        ...p,
        price: p.price ?? 0,
        cost: p.cost ?? 0,
        stock: p.stock ?? 0,
        minStock: p.minStock ?? 0,
      }));
      
      return products;
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      return [];
    }
  }

  /**
   * Obtener resumen de inventario
   */
  async getInventorySummary(): Promise<{
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalUnits: number;
  } | null> {
    try {
      const response = await apiClient.get<
        ApiResponse<any>
      >('/inventory/summary');
      
      const data = response.data;
      return {
        totalProducts: data.totalProducts || 0,
        totalValue: data.inventoryValue || 0,
        lowStockCount: data.lowStockCount || 0,
        outOfStockCount: data.outOfStockCount || 0,
        totalUnits: data.totalUnits || 0,
      };
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
      return null;
    }
  }
}

export const inventoryService = new InventoryService();
