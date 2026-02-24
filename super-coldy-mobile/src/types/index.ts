/**
 * Tipos e interfaces compartidos
 * Basados en el schema de Prisma del backend
 */

// Importar tipos de sucursales
export type { Branch, BranchCreateInput, BranchUpdateInput, BranchFilters } from './branch';

// ============================================================
// ENUMS
// ============================================================

export type UserRole = 'ADMIN' | 'CAJERO' | 'GERENTE';
export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'MIXTO';
export type SaleStatus = 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
export type Source = 'DESKTOP' | 'MOBILE';
export type InventoryMovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'VENTA';

// ============================================================
// MODELS
// ============================================================

export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: UserRole;
  active: boolean;
  timezone?: string;
  branchId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  category: string;
  stock: number;
  minStock: number;
  barcode?: string;
  imageUrl?: string;
  emoji?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
}

export interface Sale {
  id: number;
  userId: number;
  user?: User;
  total: number;
  subtotal: number;
  discount: number;
  tax: number;
  paymentMethod: PaymentMethod;
  amountReceived?: number;
  changeAmount?: number;
  status: SaleStatus;
  notes?: string;
  source: Source;
  createdAt: string;
  items: SaleItem[];
}

export interface InventoryMovement {
  id: number;
  productId: number;
  product?: Product;
  userId: number;
  user?: User;
  type: InventoryMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  referenceId?: number;
  createdAt: string;
}

// ============================================================
// API RESPONSES
// ============================================================

export interface AuthResponse {
  status: string;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// ============================================================
// STATS & REPORTS
// ============================================================

export interface DailySalesStats {
  date: string;
  totalSales: number;
  totalAmount: number;
  averageTicket: number;
  salesByPaymentMethod: {
    EFECTIVO: number;
    TARJETA: number;
    MIXTO: number;
  };
  topProducts: Array<{
    productId: number;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
}

export interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  salesByStatus: {
    COMPLETED: number;
    CANCELLED: number;
    REFUNDED: number;
  };
  salesByPaymentMethod: {
    EFECTIVO: number;
    TARJETA: number;
    MIXTO: number;
  };
  salesBySource: {
    DESKTOP: number;
    MOBILE: number;
  };
}

export interface WeeklyTrend {
  day: string;
  date: string;
  sales: number;
  revenue: number;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Array<{
    role: UserRole;
    count: number;
  }>;
}
