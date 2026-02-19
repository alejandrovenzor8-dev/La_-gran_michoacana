import prisma from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logger } from '../utils/logger.js';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Interface para crear un producto
 */
export interface ProductCreateInput {
  name: string;
  description?: string;
  price: number | Decimal;
  cost?: number | Decimal;
  category: string;
  stock?: number;
  minStock?: number;
  barcode?: string;
  imageUrl?: string;
  emoji?: string;
}

/**
 * Interface para actualizar un producto
 */
export interface ProductUpdateInput {
  name?: string;
  description?: string;
  price?: number | Decimal;
  cost?: number | Decimal;
  category?: string;
  stock?: number;
  minStock?: number;
  barcode?: string;
  imageUrl?: string;
  emoji?: string;
  active?: boolean;
}

/**
 * Interface para filtros de productos
 */
export interface ProductFilters {
  active?: boolean;
  category?: string;
  minStock?: boolean; // Busca productos con stock bajo
  branchId?: number; // Filtrar por sucursal
}

/**
 * Interface para paginación
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Interface para respuesta de lista de productos
 */
export interface ProductListResponse {
  products: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Servicio de Productos
 * Maneja todas las operaciones CRUD relacionadas con productos
 */
class ProductService {
  /**
   * Crear un nuevo producto
   * @param data - Datos del producto
   * @returns Producto creado
   * @throws AppError si el barcode ya existe
   */
  async createProduct(data: ProductCreateInput): Promise<any> {
    try {
      // Validar que barcode sea único si se proporciona
      if (data.barcode) {
        const existingProduct = await prisma.product.findUnique({
          where: { barcode: data.barcode },
        });

        if (existingProduct) {
          logger.warn('Intento de crear producto con barcode existente', {
            barcode: data.barcode,
          });
          throw new AppError(
            'Ya existe un producto con ese código de barras',
            409
          );
        }
      }

      // Crear producto
      const product = await prisma.product.create({
        data: {
          name: data.name,
          description: data.description || null,
          price: new Decimal(data.price.toString()),
          cost: data.cost ? new Decimal(data.cost.toString()) : null,
          category: data.category,
          stock: data.stock || 0,
          minStock: data.minStock || 5,
          barcode: data.barcode || null,
          imageUrl: data.imageUrl || null,
          emoji: data.emoji || null,
          active: true,
        },
      });

      logger.info('Producto creado', { productId: product.id, name: product.name });

      return product;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error creando producto:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los productos con filtros y paginación
   * @param filters - Filtros opcionales
   * @param pagination - Opciones de paginación
   * @returns Lista de productos con información de paginación
   */
  async getAllProducts(
    filters?: ProductFilters,
    pagination?: PaginationOptions
  ): Promise<ProductListResponse> {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 50;
      const skip = (page - 1) * limit;

      // Construir filtros
      const where: any = {};

      if (filters?.active !== undefined) {
        where.active = filters.active;
      } else {
        where.active = true; // Por defecto mostrar solo activos
      }

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.branchId) {
        where.branchId = filters.branchId;
      }

      if (filters?.minStock) {
        where.OR = [
          { stock: { lte: prisma.product.fields.minStock } },
        ];
      }

      // Consultar productos
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        prisma.product.count({ where }),
      ]);

      logger.debug('Productos obtenidos', { count: products.length, total });

      return {
        products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error obteniendo productos:', error);
      throw error;
    }
  }

  /**
   * Obtener un producto por ID
   * @param id - ID del producto
   * @returns Producto
   * @throws AppError si no existe
   */
  async getProductById(id: number): Promise<any> {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        logger.warn('Intento de obtener producto que no existe', { id });
        throw new AppError('Producto no encontrado', 404);
      }

      return product;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error obteniendo producto:', error);
      throw error;
    }
  }

  /**
   * Actualizar un producto
   * @param id - ID del producto
   * @param data - Datos a actualizar
   * @returns Producto actualizado
   * @throws AppError si no existe o barcode está duplicado
   */
  async updateProduct(id: number, data: ProductUpdateInput): Promise<any> {
    try {
      // Validar que el producto exista
      await this.getProductById(id);

      // Si se actualiza barcode, validar que sea único
      if (data.barcode) {
        const existingProduct = await prisma.product.findUnique({
          where: { barcode: data.barcode },
        });

        if (existingProduct && existingProduct.id !== id) {
          logger.warn('Intento de actualizar a barcode existente', {
            id,
            barcode: data.barcode,
          });
          throw new AppError(
            'Ya existe otro producto con ese código de barras',
            409
          );
        }
      }

      // Preparar datos para actualizar
      const updateData: any = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price !== undefined) {
        updateData.price = new Decimal(data.price.toString());
      }
      if (data.cost !== undefined) {
        updateData.cost = data.cost ? new Decimal(data.cost.toString()) : null;
      }
      if (data.category !== undefined) updateData.category = data.category;
      if (data.stock !== undefined) updateData.stock = data.stock;
      if (data.minStock !== undefined) updateData.minStock = data.minStock;
      if (data.barcode !== undefined) updateData.barcode = data.barcode;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.emoji !== undefined) updateData.emoji = data.emoji;
      if (data.active !== undefined) updateData.active = data.active;

      logger.info('🔧 BACKEND - updateProduct: Datos recibidos del cliente', {
        productId: id,
        datosRecibidos: JSON.stringify(data),
      });
      logger.info('🔧 BACKEND - updateProduct: Objeto updateData que se enviará a BD', {
        productId: id,
        updateData: JSON.stringify(updateData),
      });

      // Actualizar producto
      const product = await prisma.product.update({
        where: { id },
        data: updateData,
      });

      logger.info('🔧 BACKEND - updateProduct: Respuesta de BD', {
        productId: id,
        stock: product.stock,
        respuesta: JSON.stringify(product),
      });

      logger.info('Producto actualizado', { productId: id });

      return product;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error actualizando producto:', error);
      throw error;
    }
  }

  /**
   * Desactivar un producto (soft delete)
   * @param id - ID del producto
   * @returns Mensaje de confirmación
   */
  async deleteProduct(id: number): Promise<{ message: string }> {
    try {
      // Validar que exista
      await this.getProductById(id);

      // Soft delete
      await prisma.product.update({
        where: { id },
        data: { active: false },
      });

      logger.info('Producto desactivado', { productId: id });

      return { message: 'Producto desactivado' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error desactivando producto:', error);
      throw error;
    }
  }

  /**
   * Buscar productos por nombre o código de barras
   * @param query - Texto a buscar
   * @returns Productos encontrados (máximo 20)
   */
  async searchProducts(query: string): Promise<any[]> {
    try {
      const products = await prisma.product.findMany({
        where: {
          AND: [
            { active: true },
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { barcode: { contains: query, mode: 'insensitive' } },
              ],
            },
          ],
        },
        take: 20,
        orderBy: { name: 'asc' },
      });

      logger.debug('Productos buscados', { query, count: products.length });

      return products;
    } catch (error) {
      logger.error('Error buscando productos:', error);
      throw error;
    }
  }

  /**
   * Obtener productos con stock bajo
   * @param threshold - Umbral de stock bajo (default: 5)
   * @returns Productos con stock bajo
   */
  async getLowStockProducts(threshold: number = 5): Promise<any[]> {
    try {
      const products = await prisma.product.findMany({
        where: {
          AND: [
            { active: true },
            { stock: { lte: threshold } },
          ],
        },
        orderBy: { stock: 'asc' },
      });

      logger.debug('Productos con stock bajo obtenidos', {
        count: products.length,
        threshold,
      });

      return products;
    } catch (error) {
      logger.error('Error obteniendo productos con stock bajo:', error);
      throw error;
    }
  }

  /**
   * Actualizar stock de un producto
   * Crea registros de movimiento de inventario automáticamente
   * @param productId - ID del producto
   * @param quantity - Cantidad a sumar/restar (positiva o negativa)
   * @param userId - ID del usuario que realiza el movimiento
   * @param reason - Razón del movimiento
   * @returns Producto actualizado
   * @throws AppError si stock sería negativo
   */
  async updateStock(
    productId: number,
    quantity: number,
    userId: number,
    reason: string
  ): Promise<any> {
    try {
      // Obtener producto actual
      const product = await this.getProductById(productId);

      const previousStock = product.stock;
      const newStock = previousStock + quantity;

      // Validar que stock no sea negativo
      if (newStock < 0) {
        logger.warn('Intento de actualizar stock a valor negativo', {
          productId,
          previousStock,
          quantity,
          newStock,
        });
        throw new AppError('Stock insuficiente para esta operación', 400);
      }

      // Usar transacción para actualizar stock y crear asiento de inventario
      const updatedProduct = await prisma.$transaction(async (tx) => {
        // Actualizar stock del producto
        const updated = await tx.product.update({
          where: { id: productId },
          data: { stock: newStock },
        });

        // Crear movimiento de inventario
        await tx.inventoryMovement.create({
          data: {
            productId,
            userId,
            type: quantity > 0 ? 'ENTRADA' : quantity < 0 ? 'SALIDA' : 'AJUSTE',
            quantity: Math.abs(quantity),
            previousStock,
            newStock,
            reason,
          },
        });

        return updated;
      });

      logger.info('Stock actualizado', {
        productId,
        previousStock,
        newStock,
        quantity,
      });

      return updatedProduct;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error actualizando stock:', error);
      throw error;
    }
  }

  /**
   * Obtener categorías disponibles
   * @returns Array de nombres de categorías únicos
   */
  async getCategories(): Promise<string[]> {
    try {
      const categories = await prisma.product.findMany({
        where: { active: true },
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      });

      const categoryNames = categories.map((c) => c.category);

      logger.debug('Categorías obtenidas', { count: categoryNames.length });

      return categoryNames;
    } catch (error) {
      logger.error('Error obteniendo categorías:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de productos
   * @returns Estadísticas generales
   */
  async getStats(): Promise<{
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    lowStockProducts: number;
    totalValue: Decimal;
  }> {
    try {
      const [totalProducts, activeProducts, inactiveProducts, lowStock] =
        await Promise.all([
          prisma.product.count(),
          prisma.product.count({ where: { active: true } }),
          prisma.product.count({ where: { active: false } }),
          prisma.product.count({
            where: {
              active: true,
              stock: { lte: prisma.product.fields.minStock },
            },
          }),
        ]);

      // Calcular valor total del inventario
      const products = await prisma.product.findMany({
        where: { active: true },
        select: { price: true, stock: true },
      });

      const totalValue = products.reduce((sum, p) => {
        return sum.plus(new Decimal(p.price).times(p.stock));
      }, new Decimal(0));

      logger.debug('Estadísticas de productos obtenidas');

      return {
        totalProducts,
        activeProducts,
        inactiveProducts,
        lowStockProducts: lowStock,
        totalValue,
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton del servicio
export const productService = new ProductService();
