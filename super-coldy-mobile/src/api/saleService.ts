import { apiClient } from './client';
import type { Sale, ApiResponse, DailySalesStats } from '../types';

class SaleService {
  /**
   * Obtener las ventas del día actual
   */
  async getTodaySales(): Promise<{ sales: Sale[]; total: number }> {
    try {
      const response = await apiClient.get<
        ApiResponse<{ sales: Sale[]; pagination: { total: number } }>
      >('/sales?limit=100&page=1');

      return {
        sales: response.data.sales || [],
        total: response.data.pagination?.total || 0,
      };
    } catch (error) {
      console.error('Error fetching today sales:', error);
      return { sales: [], total: 0 };
    }
  }

  /**
   * Obtener estadísticas de ventas del día actual
   */
  async getDailySales(): Promise<{ stats: DailySalesStats }> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        '/sales/stats/daily'
      );

      const data = response.data;
      
      return {
        stats: {
          date: new Date().toISOString().split('T')[0],
          totalSales: data.totalSales || 0,
          totalAmount: data.totalRevenue || 0,
          averageTicket: data.averageTicket || 0,
          salesByPaymentMethod: {
            EFECTIVO: data.effectivoSales || 0,
            TARJETA: data.tarjetaSales || 0,
            MIXTO: data.mixtoSales || 0,
          },
          topProducts: data.topProducts || [],
        },
      };
    } catch (error) {
      console.error('Error fetching daily sales stats:', error);
      return {
        stats: {
          date: new Date().toISOString().split('T')[0],
          totalSales: 0,
          totalAmount: 0,
          averageTicket: 0,
          salesByPaymentMethod: {
            EFECTIVO: 0,
            TARJETA: 0,
            MIXTO: 0,
          },
          topProducts: [],
        },
      };
    }
  }

  /**
   * Obtener estadísticas de ventas en un rango de fechas
   */
  async getSalesStats(filters?: {
    startDate?: Date;
    endDate?: Date;
    userId?: number;
    status?: 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  }): Promise<{
    stats: DailySalesStats;
    total: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate)
        params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters?.userId) params.append('userId', String(filters.userId));
      if (filters?.status) params.append('status', filters.status);

      const queryString = params.toString();
      const endpoint = `/sales/stats${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<
        ApiResponse<{ stats: DailySalesStats; pagination: { total: number } }>
      >(endpoint);

      return {
        stats: response.data.stats,
        total: response.data.pagination?.total || 0,
      };
    } catch (error) {
      console.error('Error fetching sales stats:', error);
      return {
        stats: {
          date: new Date().toISOString().split('T')[0],
          totalSales: 0,
          totalAmount: 0,
          averageTicket: 0,
          salesByPaymentMethod: {
            EFECTIVO: 0,
            TARJETA: 0,
            MIXTO: 0,
          },
          topProducts: [],
        },
        total: 0,
      };
    }
  }

  /**
   * Crear una nueva venta
   */
  async createSale(data: {
    items: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
      discount?: number;
    }>;
    paymentMethod: 'EFECTIVO' | 'TARJETA' | 'MIXTO';
    discountAmount?: number;
    notes?: string;
  }): Promise<Sale> {
    try {
      const response = await apiClient.post<ApiResponse<Sale>>('/sales', data);
      return response.data;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  }

  /**
   * Obtener detalles de una venta
   */
  async getSaleById(id: number): Promise<Sale> {
    try {
      const response = await apiClient.get<ApiResponse<Sale>>(`/sales/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sale:', error);
      throw error;
    }
  }

  /**
   * Revertir una venta
   */
  async refundSale(
    id: number,
    data: {
      reason?: string;
    }
  ): Promise<Sale> {
    try {
      const response = await apiClient.post<ApiResponse<Sale>>(
        `/sales/${id}/refund`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error refunding sale:', error);
      throw error;
    }
  }
}

export const saleService = new SaleService();
