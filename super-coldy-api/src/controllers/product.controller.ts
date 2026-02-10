import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service.js';
import { logger } from '../utils/logger.js';
import { AppError, asyncHandler } from '../middlewares/errorHandler.js';

/**
 * Controlador de Productos
 * Maneja todas las operaciones CRUD de productos
 */
class ProductController {
  /**
   * Crear un nuevo producto
   * POST /api/products
   */
  async createProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      logger.info('Creando nuevo producto');

      const product = await productService.createProduct(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Producto creado exitosamente',
        data: { product },
      });
    } catch (error) {
      logger.error('Error creando producto:', error);
      next(error);
    }
  }

  /**
   * Obtener todos los productos
   * GET /api/products
   * Query parameters: page, limit, active, category, minStock
   */
  async getAllProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const activeParam = req.query.active;
      const active = activeParam === 'true' ? true : activeParam === 'false' ? false : undefined;
      const category = (req.query.category as string) || undefined;
      const minStockParam = req.query.minStock;
      const minStock = minStockParam === 'true' ? true : false;

      logger.debug('Obteniendo productos', { page, limit, active, category });

      const result = await productService.getAllProducts(
        { active, category, minStock },
        { page, limit }
      );

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      logger.error('Error obteniendo productos:', error);
      next(error);
    }
  }

  /**
   * Obtener un producto por ID
   * GET /api/products/:id
   */
  async getProductById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const productId = req.params.id;
      if (!productId) {
        throw new AppError('ID de producto requerido', 400);
      }
      const id = parseInt(productId);
      if (isNaN(id)) {
        throw new AppError('ID de producto debe ser un número válido', 400);
      }

      logger.debug('Obteniendo producto', { id });

      const product = await productService.getProductById(id);

      res.status(200).json({
        status: 'success',
        data: { product },
      });
    } catch (error) {
      logger.error('Error obteniendo producto:', error);
      next(error);
    }
  }

  /**
   * Actualizar un producto
   * PUT /api/products/:id
   */
  async updateProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const productId = req.params.id;
      if (!productId) {
        throw new AppError('ID de producto requerido', 400);
      }
      const id = parseInt(productId);
      if (isNaN(id)) {
        throw new AppError('ID de producto debe ser un número válido', 400);
      }

      logger.info('Actualizando producto', { id });

      const product = await productService.updateProduct(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Producto actualizado exitosamente',
        data: { product },
      });
    } catch (error) {
      logger.error('Error actualizando producto:', error);
      next(error);
    }
  }

  /**
   * Desactivar un producto
   * DELETE /api/products/:id
   */
  async deleteProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const productId = req.params.id;
      if (!productId) {
        throw new AppError('ID de producto requerido', 400);
      }
      const id = parseInt(productId);
      if (isNaN(id)) {
        throw new AppError('ID de producto debe ser un número válido', 400);
      }

      logger.info('Desactivando producto', { id });

      const result = await productService.deleteProduct(id);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      logger.error('Error desactivando producto:', error);
      next(error);
    }
  }

  /**
   * Buscar productos
   * GET /api/products/search?query=...
   */
  async searchProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query.q as string;

      if (!query) {
        throw new AppError('Parámetro de búsqueda requerido', 400);
      }

      logger.debug('Buscando productos', { query });

      const products = await productService.searchProducts(query);

      res.status(200).json({
        status: 'success',
        data: { products },
      });
    } catch (error) {
      logger.error('Error buscando productos:', error);
      next(error);
    }
  }

  /**
   * Obtener productos con stock bajo
   * GET /api/products/low-stock
   * Query parameters: threshold
   */
  async getLowStockProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const threshold = parseInt(req.query.threshold as string) || 5;

      logger.debug('Obteniendo productos con stock bajo', { threshold });

      const products = await productService.getLowStockProducts(threshold);

      res.status(200).json({
        status: 'success',
        data: { products, threshold },
      });
    } catch (error) {
      logger.error('Error obteniendo productos con stock bajo:', error);
      next(error);
    }
  }

  /**
   * Actualizar stock de un producto
   * POST /api/products/:id/update-stock
   * Body: { quantity, reason }
   */
  async updateStock(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const productId = req.params.id;
      if (!productId) {
        throw new AppError('ID de producto requerido', 400);
      }
      const id = parseInt(productId);
      if (isNaN(id)) {
        throw new AppError('ID de producto debe ser un número válido', 400);
      }
      const { quantity, reason } = req.body;

      if (!req.user) {
        throw new AppError('Usuario no autenticado', 401);
      }

      if (quantity === undefined) {
        throw new AppError('Cantidad requerida', 400);
      }

      logger.info('Actualizando stock de producto', { id, quantity, userId: req.user.userId });

      const product = await productService.updateStock(
        id,
        quantity,
        req.user.userId,
        reason || 'Ajuste manual'
      );

      res.status(200).json({
        status: 'success',
        message: 'Stock actualizado exitosamente',
        data: { product },
      });
    } catch (error) {
      logger.error('Error actualizando stock:', error);
      next(error);
    }
  }

  /**
   * Obtener categorías disponibles
   * GET /api/products/categories
   */
  async getCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      logger.debug('Obteniendo categorías');

      const categories = await productService.getCategories();

      res.status(200).json({
        status: 'success',
        data: { categories },
      });
    } catch (error) {
      logger.error('Error obteniendo categorías:', error);
      next(error);
    }
  }

  /**
   * Obtener estadísticas de productos
   * GET /api/products/stats
   */
  async getStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      logger.debug('Obteniendo estadísticas de productos');

      const stats = await productService.getStats();

      res.status(200).json({
        status: 'success',
        data: { stats },
      });
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      next(error);
    }
  }
}

// Exportar instancia singleton del controlador
export const productController = new ProductController();
