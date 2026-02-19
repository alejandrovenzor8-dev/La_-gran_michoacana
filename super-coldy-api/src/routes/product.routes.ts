import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { productController } from '../controllers/product.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = Router();

/**
 * POST /api/products
 * Crear un nuevo producto
 * Requiere: autenticación, permisos de ADMIN o GERENTE
 */
router.post(
  '/',
  authenticateToken,
  requireRole('ADMIN', 'GERENTE'),
  body('name')
    .notEmpty()
    .withMessage('Nombre requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('price')
    .isDecimal({ decimal_digits: '1,2' })
    .withMessage('Precio inválido')
    .custom((value) => parseFloat(value) > 0)
    .withMessage('Precio debe ser mayor a 0'),
  body('category')
    .notEmpty()
    .withMessage('Categoría requerida')
    .isLength({ min: 2, max: 50 })
    .withMessage('Categoría inválida'),
  body('cost')
    .optional()
    .isDecimal({ decimal_digits: '1,2' })
    .withMessage('Costo inválido'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descripción muy larga'),
  body('barcode')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Código de barras inválido'),
  body('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock mínimo inválido'),
  body('emoji')
    .optional()
    .isLength({ max: 2 })
    .withMessage('Emoji inválido'),
  validate,
  asyncHandler((req, res, next) => productController.createProduct(req, res, next))
);

/**
 * GET /api/products
 * Obtener todos los productos con filtros y paginación
 * Query parameters:
 * - page: número de página (default: 1)
 * - limit: productos por página (default: 50)
 * - active: true/false (default: true)
 * - category: nombre de categoría
 * - minStock: true para mostrar solo productos con stock bajo
 * Requiere: autenticación (para filtrar por sucursal del usuario)
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler((req, res, next) => productController.getAllProducts(req, res, next))
);

/**
 * GET /api/products/categories
 * Obtener categorías disponibles
 */
router.get(
  '/categories',
  asyncHandler((req, res, next) => productController.getCategories(req, res, next))
);

/**
 * GET /api/products/stats
 * Obtener estadísticas de productos
 */
router.get(
  '/stats',
  authenticateToken,
  requireRole('ADMIN', 'GERENTE'),
  asyncHandler((req, res, next) => productController.getStats(req, res, next))
);

/**
 * GET /api/products/low-stock
 * Obtener productos con stock bajo
 * Query parameters:
 * - threshold: umbral de stock (default: 5)
 */
router.get(
  '/low-stock',
  authenticateToken,
  asyncHandler((req, res, next) => productController.getLowStockProducts(req, res, next))
);

/**
 * GET /api/products/search
 * Buscar productos por nombre o código de barras
 * Query parameters:
 * - q: término de búsqueda (requerido)
 */
router.get(
  '/search',
  query('q')
    .notEmpty()
    .withMessage('Parámetro de búsqueda requerido'),
  validate,
  asyncHandler((req, res, next) => productController.searchProducts(req, res, next))
);

/**
 * GET /api/products/:id
 * Obtener un producto por ID
 */
router.get(
  '/:id',
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  validate,
  asyncHandler((req, res, next) => productController.getProductById(req, res, next))
);

/**
 * PUT /api/products/:id
 * Actualizar un producto
 * Requiere: autenticación, permisos de ADMIN o GERENTE
 */
router.put(
  '/:id',
  authenticateToken,
  requireRole('ADMIN', 'GERENTE'),
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('price')
    .optional()
    .isDecimal({ decimal_digits: '1,2' })
    .withMessage('Precio inválido')
    .custom((value) => parseFloat(value) > 0)
    .withMessage('Precio debe ser mayor a 0'),
  body('category')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Categoría inválida'),
  body('cost')
    .optional()
    .isDecimal({ decimal_digits: '1,2' })
    .withMessage('Costo inválido'),
  body('barcode')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Código de barras inválido'),
  body('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock mínimo inválido'),
  body('emoji')
    .optional()
    .isLength({ max: 2 })
    .withMessage('Emoji inválido'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('active debe ser verdadero o falso'),
  validate,
  asyncHandler((req, res, next) => productController.updateProduct(req, res, next))
);

/**
 * POST /api/products/:id/update-stock
 * Actualizar stock de un producto
 * Requiere: autenticación
 * Body: { quantity: number, reason?: string }
 */
router.post(
  '/:id/update-stock',
  authenticateToken,
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  body('quantity')
    .isInt()
    .withMessage('Cantidad debe ser un número entero'),
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Razón muy larga'),
  validate,
  asyncHandler((req, res, next) => productController.updateStock(req, res, next))
);

/**
 * DELETE /api/products/:id
 * Desactivar un producto (soft delete)
 * Requiere: autenticación, permisos de ADMIN o GERENTE
 */
router.delete(
  '/:id',
  authenticateToken,
  requireRole('ADMIN', 'GERENTE'),
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  validate,
  asyncHandler((req, res, next) => productController.deleteProduct(req, res, next))
);

export default router;
