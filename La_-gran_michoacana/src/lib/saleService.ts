import { apiClient } from './apiClient';

export interface SaleItem {
  id?: number;
  productId: number;
  quantity: number;
  price: number;
  subtotal?: number;
}

export interface Sale {
  id?: number;
  userId?: number;
  date?: string;
  total: number;
  paymentMethod?: string;
  items: SaleItem[];
  status?: string;
}

export interface SaleResponse {
  success: boolean;
  data: Sale | Sale[];
  message?: string;
}

export interface SalesStatsResponse {
  success: boolean;
  data: {
    totalSales: number;
    totalRevenue: number;
    averageTicket: number;
    transactionCount: number;
    topProducts?: Array<{ name: string; quantity: number; revenue: number }>;
  };
  message?: string;
}

export interface DailyReportResponse {
  success: boolean;
  data: {
    date: string;
    totalSales: number;
    totalRevenue: number;
    transactions: number;
    averageTicket: number;
    byPaymentMethod?: Record<string, { count: number; amount: number }>;
  };
  message?: string;
}

interface SaleFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}

class SaleService {
  /**
   * Crear nueva venta
   */
  async createSale(sale: Sale): Promise<Sale> {
    try {
      const response = await apiClient.post<SaleResponse>('/sales', sale);
      return Array.isArray(response.data) ? response.data[0] : response.data;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  }

  /**
   * Obtener venta por ID
   */
  async getSaleById(id: number): Promise<Sale> {
    try {
      const response = await apiClient.get<SaleResponse>(`/sales/${id}`);
      return Array.isArray(response.data) ? response.data[0] : response.data;
    } catch (error) {
      console.error('Error fetching sale:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las ventas con filtros opcionales
   */
  async getAllSales(filters?: SaleFilters): Promise<Sale[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const queryString = params.toString();
      const endpoint = `/sales${queryString ? '?' + queryString : ''}`;
      const response = await apiClient.get<SaleResponse>(endpoint);
      const sales = Array.isArray(response.data) ? response.data : (response as any).data?.data ? [(response as any).data.data] : [response.data];
      return sales || [];
    } catch (error) {
      console.error('Error fetching sales:', error);
      return [];
    }
  }

  /**
   * Obtener reporte diario
   */
  async getDailyReport(date: string): Promise<DailyReportResponse['data']> {
    try {
      const response = await apiClient.get<DailyReportResponse>(`/sales/daily?date=${date}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching daily report:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de ventas
   */
  async getSalesStats(
    startDate?: string,
    endDate?: string
  ): Promise<SalesStatsResponse['data']> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString();
      const endpoint = `/sales/stats${queryString ? '?' + queryString : ''}`;
      const response = await apiClient.get<SalesStatsResponse>(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching sales stats:', error);
      throw error;
    }
  }

  /**
   * Cancelar venta
   */
  async cancelSale(id: number): Promise<Sale> {
    try {
      const response = await apiClient.put<SaleResponse>(`/sales/${id}/cancel`, {});
      return Array.isArray(response.data) ? response.data[0] : response.data;
    } catch (error) {
      console.error('Error canceling sale:', error);
      throw error;
    }
  }
}

export const saleService = new SaleService();
