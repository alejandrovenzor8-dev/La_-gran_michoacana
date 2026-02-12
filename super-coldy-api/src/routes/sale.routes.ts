/**
 * Rutas del módulo de Ventas
 * Maneja todos los endpoints relacionados con ventas y transacciones
 */

import { Router } from 'express';
import { saleController } from '../controllers/sale.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  validateCreateSale,
  validateSaleId,
  validateSaleFilters,
  validateDailyReport,
  validateStatsQuery,
} from '../middlewares/validators.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * POST /api/sales
 * @desc    Crear una nueva venta
 * @access  Private (CAJERO, GERENTE, ADMIN)
 */
router.post(
  '/',
  requireRole('CAJERO', 'GERENTE', 'ADMIN'),
  validateCreateSale(),
  validate,
  asyncHandler(saleController.create.bind(saleController))
);

/**
 * GET /api/sales
 * @desc    Obtener todas las ventas con filtros y paginación
 * @access  Private (GERENTE, ADMIN)
 */
router.get(
  '/',
  requireRole('GERENTE', 'ADMIN'),
  validateSaleFilters(),
  validate,
  asyncHandler(saleController.getAll.bind(saleController))
);

/**
 * GET /api/sales/daily
 * @desc    Obtener reporte de ventas del día
 * @access  Private (GERENTE, ADMIN)
 * @note    Esta ruta debe estar ANTES de /:id para evitar conflicto
 */
router.get(
  '/daily',
  requireRole('GERENTE', 'ADMIN'),
  validateDailyReport(),
  validate,
  asyncHandler(saleController.getDailyReport.bind(saleController))
);

/**
 * GET /api/sales/weekly-trend
 * @desc    Obtener tendencia de ventas de la última semana
 * @access  Private (GERENTE, ADMIN)
 * @note    Esta ruta debe estar ANTES de /:id para evitar conflicto
 */
router.get(
  '/weekly-trend',
  requireRole('GERENTE', 'ADMIN'),
  asyncHandler(saleController.getWeeklyTrend.bind(saleController))
);

/**
 * GET /api/sales/monthly-comparison
 * @desc    Obtener comparación por semanas del mes
 * @access  Private (GERENTE, ADMIN)
 * @note    Esta ruta debe estar ANTES de /:id para evitar conflicto
 */
router.get(
  '/monthly-comparison',
  requireRole('GERENTE', 'ADMIN'),
  asyncHandler(saleController.getMonthlyComparison.bind(saleController))
);

/**
 * GET /api/sales/stats
 * @desc    Obtener estadísticas de ventas
 * @access  Private (GERENTE, ADMIN)
 * @note    Esta ruta debe estar ANTES de /:id para evitar conflicto
 */
router.get(
  '/stats',
  requireRole('GERENTE', 'ADMIN'),
  validateStatsQuery(),
  validate,
  asyncHandler(saleController.getStats.bind(saleController))
);

/**
 * GET /api/sales/cashier-cut
 * @desc    Obtener corte de caja del día actual
 * @access  Private (CAJERO, GERENTE, ADMIN)
 * @note    Esta ruta debe estar ANTES de /:id para evitar conflicto
 */
router.get(
  '/cashier-cut',
  requireRole('CAJERO', 'GERENTE', 'ADMIN'),
  asyncHandler(saleController.getCashierCut.bind(saleController))
);

/**
 * GET /api/sales/:id
 * @desc    Obtener una venta por ID
 * @access  Private (CAJERO, GERENTE, ADMIN)
 */
router.get(
  '/:id',
  requireRole('CAJERO', 'GERENTE', 'ADMIN'),
  validateSaleId(),
  validate,
  asyncHandler(saleController.getById.bind(saleController))
);

/**
 * PUT /api/sales/:id/cancel
 * @desc    Cancelar una venta y restaurar stock
 * @access  Private (GERENTE, ADMIN)
 */
router.put(
  '/:id/cancel',
  requireRole('GERENTE', 'ADMIN'),
  validateSaleId(),
  validate,
  asyncHandler(saleController.cancel.bind(saleController))
);

export default router;
