import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { branchController } from '../controllers/branch.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = Router();

/**
 * POST /api/branches
 * Crear una nueva sucursal
 * Requiere: autenticación, permisos de ADMIN
 */
router.post(
  '/',
  authenticateToken,
  requireRole('ADMIN'),
  body('name')
    .notEmpty()
    .withMessage('Nombre requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Dirección muy larga'),
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Teléfono muy largo'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Estado activo debe ser booleano'),
  validate,
  asyncHandler(branchController.createBranch.bind(branchController))
);

/**
 * GET /api/branches
 * Obtener todas las sucursales
 * Requiere: autenticación
 */
router.get(
  '/',
  authenticateToken,
  query('active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Estado activo debe ser true o false'),
  validate,
  asyncHandler(branchController.getAllBranches.bind(branchController))
);

/**
 * GET /api/branches/:id
 * Obtener una sucursal por ID
 * Requiere: autenticación
 */
router.get(
  '/:id',
  authenticateToken,
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de sucursal inválido'),
  validate,
  asyncHandler(branchController.getBranchById.bind(branchController))
);

/**
 * PUT /api/branches/:id
 * Actualizar una sucursal
 * Requiere: autenticación, permisos de ADMIN
 */
router.put(
  '/:id',
  authenticateToken,
  requireRole('ADMIN'),
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de sucursal inválido'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Dirección muy larga'),
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Teléfono muy largo'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Estado activo debe ser booleano'),
  validate,
  asyncHandler(branchController.updateBranch.bind(branchController))
);

/**
 * PATCH /api/branches/:id/status
 * Activar/Desactivar una sucursal
 * Requiere: autenticación, permisos de ADMIN
 */
router.patch(
  '/:id/status',
  authenticateToken,
  requireRole('ADMIN'),
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de sucursal inválido'),
  body('active')
    .isBoolean()
    .withMessage('Estado activo requerido y debe ser booleano'),
  validate,
  asyncHandler(branchController.toggleBranchStatus.bind(branchController))
);

/**
 * DELETE /api/branches/:id
 * Eliminar una sucursal (soft delete)
 * Requiere: autenticación, permisos de ADMIN
 */
router.delete(
  '/:id',
  authenticateToken,
  requireRole('ADMIN'),
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de sucursal inválido'),
  validate,
  asyncHandler(branchController.deleteBranch.bind(branchController))
);

export default router;
