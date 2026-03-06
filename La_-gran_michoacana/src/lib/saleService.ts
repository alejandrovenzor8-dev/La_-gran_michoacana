import { apiClient } from './apiClient';

export interface SaleItem {
  id?: number;
  productId: number | string;
  productName?: string;
  quantity: number;
  price?: number;
  unitPrice?: number;
  subtotal?: number;
  discount?: number;
}

export interface Sale {
  id?: number;
  userId?: number;
  date?: string;
  total?: number;
  paymentMethod?: string;
  items: SaleItem[];
  status?: string;
  branchId?: number;
  amountReceived?: number;
  changeAmount?: number;
  cashAmount?: number;
  cardAmount?: number;
  discount?: number;
  tax?: number;
  notes?: string;
  source?: 'DESKTOP' | 'MOBILE';
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
  branchId?: number;
  page?: number;
  limit?: number;
}

class SaleService {
  /**
   * Crear nueva venta
   */
  async createSale(sale: Sale): Promise<Sale> {
    try {
      const payload = {
        items: (sale.items || []).map((item) => {
          const quantity = Number(item.quantity || 0);
          const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
          const subtotal = Number(item.subtotal ?? quantity * unitPrice);

          return {
            productId: String(item.productId),
            productName: item.productName || `Producto ${item.productId}`,
            quantity,
            unitPrice,
            subtotal,
            discount: Number(item.discount ?? 0),
          };
        }),
        paymentMethod: sale.paymentMethod,
        branchId: sale.branchId,
        amountReceived: sale.amountReceived,
        changeAmount: sale.changeAmount,
        cashAmount: sale.cashAmount,
        cardAmount: sale.cardAmount,
        discount: Number(sale.discount ?? 0),
        tax: Number(sale.tax ?? 0),
        notes: sale.notes,
        source: sale.source || 'DESKTOP',
      };

      const response = await apiClient.post<SaleResponse>('/sales', payload);
      return Array.isArray(response.data) ? response.data[0] : response.data;
    } catch (error) {
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
      if (filters?.branchId) params.append('branchId', String(filters.branchId));
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const queryString = params.toString();
      const endpoint = `/sales${queryString ? '?' + queryString : ''}`;
      const response = await apiClient.get<any>(endpoint);
      
      // Manejar diferentes estructuras de respuesta del backend
      let sales: Sale[] = [];
      
      if (response.data) {
        // Si tiene propiedad 'data'
        if (Array.isArray(response.data)) {
          sales = response.data;
        } else if (response.data.data) {
          // Si data.data contiene el array
          sales = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
        } else if (response.data.sales) {
          // Si data.sales contiene el array
          sales = Array.isArray(response.data.sales) ? response.data.sales : [response.data.sales];
        } else {
          // Si response.data es el objeto de venta directamente
          sales = [response.data];
        }
      } else if (Array.isArray(response)) {
        sales = response;
      }
      
      return sales || [];
    } catch (error) {
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
      throw error;
    }
  }

  /**
   * Obtener estadísticas de ventas
   */
  async getSalesStats(
    startDate?: string,
    endDate?: string,
    additionalParams?: string
  ): Promise<SalesStatsResponse['data']> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      let queryString = params.toString();
      
      // Agregar parámetros adicionales si existen (ej: branchId)
      if (additionalParams) {
        const additionalQueryParams = additionalParams.startsWith('?') ? additionalParams.substring(1) : additionalParams;
        queryString = queryString ? `${queryString}&${additionalQueryParams}` : additionalQueryParams;
      }

      const endpoint = `/sales/stats${queryString ? '?' + queryString : ''}`;
      const response = await apiClient.get<SalesStatsResponse>(endpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener tendencia de ventas de la última semana
   */
  async getWeeklyTrend(startDate?: string, endDate?: string, additionalParams?: string): Promise<Array<{ day: string; ventas: number; transacciones: number }>> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      let queryString = params.toString();
      
      // Agregar parámetros adicionales si existen (ej: branchId)
      if (additionalParams) {
        const additionalQueryParams = additionalParams.startsWith('?') ? additionalParams.substring(1) : additionalParams;
        queryString = queryString ? `${queryString}&${additionalQueryParams}` : additionalQueryParams;
      }

      const endpoint = `/sales/weekly-trend${queryString ? '?' + queryString : ''}`;
      const response = await apiClient.get<{ success: boolean; data: any[] }>(endpoint);
      return response.data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Obtener comparación por semanas del mes
   */
  async getMonthlyComparison(startDate?: string, endDate?: string, additionalParams?: string): Promise<Array<{ periodo: string; ventas: number }>> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      let queryString = params.toString();
      
      // Agregar parámetros adicionales si existen (ej: branchId)
      if (additionalParams) {
        const additionalQueryParams = additionalParams.startsWith('?') ? additionalParams.substring(1) : additionalParams;
        queryString = queryString ? `${queryString}&${additionalQueryParams}` : additionalQueryParams;
      }

      const endpoint = `/sales/monthly-comparison${queryString ? '?' + queryString : ''}`;
      const response = await apiClient.get<{ success: boolean; data: any[] }>(endpoint);
      return response.data || [];
    } catch (error) {
      return [];
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
      throw error;
    }
  }

  /**
   * Obtener corte de caja del día actual
   */
  async getCashierCut(additionalParams?: string, userId?: number): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', String(userId));

      let queryString = params.toString();
      
      // Agregar parámetros adicionales si existen (ej: branchId)
      if (additionalParams) {
        const additionalQueryParams = additionalParams.startsWith('?') ? additionalParams.substring(1) : additionalParams;
        queryString = queryString ? `${queryString}&${additionalQueryParams}` : additionalQueryParams;
      }

      const endpoint = `/sales/cashier-cut${queryString ? '?' + queryString : ''}`;
      const response = await apiClient.get<{ success: boolean; data: any }>(endpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const saleService = new SaleService();
