// Branch types for frontend

export interface Branch {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    sales: number;
    products: number;
  };
}

export interface BranchCreateInput {
  name: string;
  address?: string;
  phone?: string;
  active?: boolean;
}

export interface BranchUpdateInput {
  name?: string;
  address?: string;
  phone?: string;
  active?: boolean;
}

export interface BranchFilters {
  active?: boolean;
}
