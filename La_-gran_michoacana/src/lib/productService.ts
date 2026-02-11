import { apiClient } from './apiClient';

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category?: string;
  image?: string;
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
  async getAllProducts(): Promise<Product[]> {
    try {
      const response = await apiClient.get<ProductResponse>('/products');
      // Asegurarse de que la respuesta tiene un array en data
      let products = Array.isArray(response.data) ? response.data : (response as any).data?.products || (response as any).data?.data || [];
      
      // Mapear campos del backend al frontend (stock → quantity, imageUrl → image)
      products = products.map((p: any) => ({
        ...p,
        quantity: p.stock || p.quantity || 0,
        image: p.imageUrl || p.image || '',
      }));
      
      return products || [];
    } catch (error) {
      console.error('Error fetching products:', error);
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
      };
    } catch (error) {
      console.error('Error fetching product:', error);
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
      console.error('Error searching products:', error);
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
      console.error('Error fetching products by category:', error);
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
      
      console.log('📤 Enviando al backend:', payload);
      
      const response = await apiClient.post<ProductDetailResponse>('/products', payload);
      // El servidor puede devolver {product: {...}} o directamente el Product
      const data = (response.data as any).product || response.data;
      console.log('📦 createProduct response:', { original: response.data, extracted: data });
      
      // Mapear de vuelta los campos del backend al frontend
      return {
        ...data,
        quantity: data.stock || 0,  // Mapear stock → quantity
        image: data.imageUrl || '',  // Mapear imageUrl → image
      };
    } catch (error) {
      console.error('Error creating product:', error);
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
      
      console.log('📤 updateProduct - ID:', id);
      console.log('📤 updateProduct - Payload enviado:', JSON.stringify(payload, null, 2));
      
      const response = await apiClient.put<ProductDetailResponse>(`/products/${id}`, payload);
      
      console.log('📥 updateProduct - Respuesta completa del servidor:', response);
      
      const data = (response.data as any).product || response.data;
      
      console.log('📥 updateProduct - Datos extraídos:', JSON.stringify(data, null, 2));
      console.log('📥 updateProduct - Stock en respuesta:', data.stock);
      console.log('📥 updateProduct - Nombre en respuesta:', data.name);
      
      // Mapear de vuelta los campos del backend al frontend
      const mapped = {
        ...data,
        quantity: data.stock || data.quantity || 0,
        image: data.imageUrl || data.image || '',
      };
      
      console.log('✅ updateProduct - Objeto mapeado final:', JSON.stringify(mapped, null, 2));
      
      return mapped;
    } catch (error) {
      console.error('❌ Error updating product:', error);
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
      console.error('Error deleting product:', error);
      throw error;
    }
  }
}

export const productService = new ProductService();
