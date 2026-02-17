import { apiClient } from './apiClient';
import { Product } from './productService';

export interface InventoryMovement {
  id?: number;
  productId: number;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason?: string;
  date?: string;
  user?: string;
}

export interface InventoryResponse {
  success: boolean;
  data: InventoryMovement | InventoryMovement[];
  message?: string;
}

export interface InventoryStatsResponse {
  success: boolean;
  data: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalValue: number;
  };
  message?: string;
}

class InventoryService {
  /**
   * Obtener movimientos de inventario de un producto
   */
  async getMovementsByProduct(productId: number): Promise<InventoryMovement[]> {
    try {
      const response = await apiClient.get<InventoryResponse>(`/inventory/${productId}`);
      const movements = Array.isArray(response.data) ? response.data : (response as any).data?.data ? [(response as any).data.data] : [response.data];
      return movements || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Registrar movimiento de inventario
   */
  async createMovement(movement: InventoryMovement): Promise<InventoryMovement> {
    try {
      const response = await apiClient.post<InventoryResponse>('/inventory', movement);
      return Array.isArray(response.data) ? response.data[0] : response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener entrada de inventario
   */
  async receiveStock(productId: number, quantity: number, reason?: string): Promise<InventoryMovement> {
    return this.createMovement({
      productId,
      movementType: 'in',
      quantity,
      reason: reason || 'Purchase order',
    });
  }

  /**
   * Obtener salida de inventario
   */
  async releaseStock(productId: number, quantity: number, reason?: string): Promise<InventoryMovement> {
    return this.createMovement({
      productId,
      movementType: 'out',
      quantity,
      reason: reason || 'Sale',
    });
  }

  /**
   * Ajuste de inventario
   */
  async adjustStock(productId: number, quantity: number, reason: string): Promise<InventoryMovement> {
    return this.createMovement({
      productId,
      movementType: 'adjustment',
      quantity,
      reason,
    });
  }

  /**
   * Obtener estadísticas de inventario
   */
  async getInventoryStats(): Promise<InventoryStatsResponse['data']> {
    try {
      const response = await apiClient.get<InventoryStatsResponse>('/inventory/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener todos los movimientos de inventario con filtros
   */
  async getAllMovements(
    startDate?: string,
    endDate?: string,
    movementType?: string
  ): Promise<InventoryMovement[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (movementType) params.append('movementType', movementType);

      const queryString = params.toString();
      const endpoint = `/inventory${queryString ? '?' + queryString : ''}`;
      const response = await apiClient.get<InventoryResponse>(endpoint);
      const movements = Array.isArray(response.data) ? response.data : (response as any).data?.data ? [(response as any).data.data] : [response.data];
      return movements || [];
    } catch (error) {
      return [];
    }
  }
}

export const inventoryService = new InventoryService();
