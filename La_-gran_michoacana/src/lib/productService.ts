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

interface ProductsPagePayload {
  products?: any[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

class ProductService {
  private normalizeProduct(raw: any): Product {
    return {
      ...raw,
      quantity: raw?.stock ?? raw?.quantity ?? 0,
      image: raw?.imageUrl ?? raw?.image ?? '',
      emoji: raw?.emoji ?? '',
      description: raw?.description ?? '',
      category: raw?.category ?? '',
    };
  }

  private buildQueryString(queryParams: string = ''): string {
    const raw = queryParams.startsWith('?') ? queryParams.slice(1) : queryParams;
    const params = new URLSearchParams(raw);

    // Evitar el limite por defecto del backend (50)
    if (!params.has('limit')) {
      params.set('limit', '200');
    }

    return params.toString() ? `?${params.toString()}` : '';
  }

  /**
   * Obtener todos los productos
   */
  async getAllProducts(queryParams: string = ''): Promise<Product[]> {
    try {
      const normalizedQuery = this.buildQueryString(queryParams);
      const response = await apiClient.get<any>(`/products${normalizedQuery}`);

      const firstPagePayload: ProductsPagePayload = (response as any)?.data || {};
      const firstPageProducts = Array.isArray(firstPagePayload.products)
        ? firstPagePayload.products
        : Array.isArray((response as any)?.data)
          ? (response as any).data
          : [];

      let allProducts = [...firstPageProducts];

      // Si la API responde paginada, traer el resto de paginas
      const totalPages = firstPagePayload.totalPages ?? 1;
      const hasExplicitPage = new URLSearchParams(normalizedQuery.startsWith('?') ? normalizedQuery.slice(1) : normalizedQuery).has('page');

      if (totalPages > 1 && !hasExplicitPage) {
        const extraRequests: Promise<any>[] = [];
        for (let page = 2; page <= totalPages; page += 1) {
          const pageParams = new URLSearchParams(normalizedQuery.startsWith('?') ? normalizedQuery.slice(1) : normalizedQuery);
          pageParams.set('page', String(page));
          extraRequests.push(apiClient.get<any>(`/products?${pageParams.toString()}`));
        }

        const extraResponses = await Promise.all(extraRequests);
        for (const extraResponse of extraResponses) {
          const pageProducts = (extraResponse as any)?.data?.products;
          if (Array.isArray(pageProducts)) {
            allProducts = allProducts.concat(pageProducts);
          }
        }
      }

      return allProducts.map((p) => this.normalizeProduct(p));
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
      return this.normalizeProduct(data);
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
      products = products.map((p: any) => this.normalizeProduct(p));
      
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
      products = products.map((p: any) => this.normalizeProduct(p));
      
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
        branchId: product.branchId,  // ✅ Incluir branchId
      };
      
      // Solo incluir imageUrl si la imagen fue proporcionada
      if (product.image) {
        payload.imageUrl = product.image;
      }
      
      console.log('🚀 ProductService - Enviando payload:', payload);
      
      const response = await apiClient.post<ProductDetailResponse>('/products', payload);
      // El servidor puede devolver {product: {...}} o directamente el Product
      const data = (response.data as any).product || response.data;
      
      // Mapear de vuelta los campos del backend al frontend
      return this.normalizeProduct({
        ...data,
        branchId: data.branchId,
      });
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
      if (product.branchId !== undefined) payload.branchId = product.branchId;  // ✅ Incluir branchId
      
      console.log('🔄 ProductService - Actualizando producto con payload:', payload);
      
      const response = await apiClient.put<ProductDetailResponse>(`/products/${id}`, payload);
      
      const data = (response.data as any).product || response.data;
      
      // Mapear de vuelta los campos del backend al frontend
      const mapped = this.normalizeProduct({
        ...data,
        branchId: data.branchId,
      });
      
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
