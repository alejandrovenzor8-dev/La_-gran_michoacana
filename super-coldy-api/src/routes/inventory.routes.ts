/**
 * Rutas de Inventario
 * Maneja todos los endpoints relacionados con inventario
 */

import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * GET /api/inventory/summary
 * @desc    Obtener resumen del inventario
 * @access  Private (CAJERO, GERENTE, ADMIN)
 */
router.get(
  '/summary',
  requireRole('CAJERO', 'GERENTE', 'ADMIN'),
  asyncHandler(inventoryController.getSummary.bind(inventoryController))
);

export default router;
