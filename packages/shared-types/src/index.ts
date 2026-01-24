// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'cashier' | 'manager';
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  category: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Sale Types
export interface Sale {
  id: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  userId: string;
  branchId: string;
  cashRegisterId: string;
  items: SaleItem[];
  createdAt: Date;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  toppings?: string[];
  notes?: string;
}

// Inventory Types
export interface Inventory {
  id: string;
  productId: string;
  product?: Product;
  branchId: string;
  stock: number;
  minStock: number;
  maxStock: number;
  lastRestockDate?: Date;
  updatedAt: Date;
}

// Cash Register Types
export interface CashRegister {
  id: string;
  branchId: string;
  userId: string;
  user?: User;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  difference?: number;
  openedAt: Date;
  closedAt?: Date;
  status: 'open' | 'closed';
}

// Branch Types
export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}
