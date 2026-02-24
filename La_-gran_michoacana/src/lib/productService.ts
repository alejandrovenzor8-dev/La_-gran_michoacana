import { apiClient } from './apiClient';

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category?: string;
  image?: string;  // Cambiado de imageUrl a image para consistencia en el frontend
  emoji?: string;
  branchId?: number;
}

export interface ProductResponse {
  success: boolean;
  data: Product[];
  message?: string;
}

export interface ProductDetailResponse {
  success: boolean;
  data: Product;
  message?: string;
}

class ProductService {
  /**
   * Obtener todos los productos
   */
  async getAllProducts(queryParams: string = ''): Promise<Product[]> {
    try {
      const url = `/products${queryParams}`;
      const response = await apiClient.get<ProductResponse>(url);
      // Asegurarse de que la respuesta tiene un array en data
      let products = Array.isArray(response.data) ? response.data : (response as any).data?.products || (response as any).data?.data || [];
      
      // Mapear campos del backend al frontend (stock → quantity, imageUrl → image)
      products = products.map((p: any) => ({
        ...p,
        quantity: p.stock || p.quantity || 0,
        image: p.imageUrl || p.image || '',
        emoji: p.emoji || '',
      }));
      
      return products || [];
    } catch (error) {
      // Retornar array vacío en caso de error para evitar errores de .map()
      return [];
    }
  }

  /**
   * Obtener producto por ID
   */
  async getProductById(id: number): Promise<Product> {
    try {
      const response = await apiClient.get<ProductDetailResponse>(`/products/${id}`);
      const data = (response.data as any).product || response.data;
      // Mapear campos del backend al frontend
      return {
        ...data,
        quantity: data.stock || data.quantity || 0,
        image: data.imageUrl || data.image || '',
        emoji: data.emoji || '',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar productos por nombre o categoría
   */
  async searchProducts(query: string): Promise<Product[]> {
    try {
      const response = await apiClient.get<ProductResponse>(`/products?search=${query}`);
      let products = response.data || [];
      
      // Mapear campos del backend al frontend
      products = products.map((p: any) => ({
        ...p,
        quantity: p.stock || p.quantity || 0,
        image: p.imageUrl || p.image || '',
      }));
      
      return products || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener productos por categoría
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const response = await apiClient.get<ProductResponse>(`/products?category=${category}`);
      let products = response.data || [];
      
      // Mapear campos del backend al frontend
      products = products.map((p: any) => ({
        ...p,
        quantity: p.stock || p.quantity || 0,
        image: p.imageUrl || p.image || '',
      }));
      
      return products || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crear nuevo producto
   */
  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      // Mapear campos del frontend al backend
      const payload: any = {
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.quantity || 0,  // Mapear quantity → stock
        category: product.category || '',
      };
      
      // Solo incluir imageUrl si la imagen fue proporcionada
      if (product.image) {
        payload.imageUrl = product.image;
      }
      
      const response = await apiClient.post<ProductDetailResponse>('/products', payload);
      // El servidor puede devolver {product: {...}} o directamente el Product
      const data = (response.data as any).product || response.data;
      
      // Mapear de vuelta los campos del backend al frontend
      return {
        ...data,
        quantity: data.stock || 0,  // Mapear stock → quantity
        image: data.imageUrl || '',  // Mapear imageUrl → image
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar producto
   */
  async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    try {
      // Construir payload limpio solo con campos actualizables
      const payload: any = {};
      
      if (product.name !== undefined) payload.name = product.name;
      if (product.description !== undefined) payload.description = product.description;
      if (product.price !== undefined) payload.price = product.price;
      if (product.quantity !== undefined) payload.stock = product.quantity;  // Mapear quantity → stock
      if (product.category !== undefined) payload.category = product.category;
      if ('image' in product && product.image !== undefined) payload.imageUrl = product.image;  // Mapear image → imageUrl
      
      const response = await apiClient.put<ProductDetailResponse>(`/products/${id}`, payload);
      
      const data = (response.data as any).product || response.data;
      
      // Mapear de vuelta los campos del backend al frontend
      const mapped = {
        ...data,
        quantity: data.stock || data.quantity || 0,
        image: data.imageUrl || data.image || '',
      };
      
      return mapped;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar producto
   */
  async deleteProduct(id: number): Promise<void> {
    try {
      await apiClient.delete(`/products/${id}`);
    } catch (error) {
      throw error;
    }
  }
}

export const productService = new ProductService();
