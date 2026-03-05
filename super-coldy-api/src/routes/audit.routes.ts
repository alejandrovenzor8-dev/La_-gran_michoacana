import { Router } from 'express';
import { param, query } from 'express-validator';
import { auditController } from '../controllers/audit.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = Router();

/**
 * GET /api/audit/logs
 * Obtener todos los logs de auditoría con filtros opcionales
 * Requiere: autenticación, permisos de ADMIN
 */
router.get(
  '/logs',
  authenticateToken,
  requireRole('ADMIN'),
  query('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de usuario inválido'),
  query('branchId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de sucursal inválido'),
  query('entity')
    .optional()
    .isString()
    .withMessage('Entidad debe ser texto'),
  query('action')
    .optional()
    .isIn(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'OPEN_CASH_REGISTER', 'CLOSE_CASH_REGISTER'])
    .withMessage('Acción inválida'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin inválida'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Límite debe estar entre 1 y 200'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset debe ser mayor o igual a 0'),
  validate,
  asyncHandler(auditController.getAuditLogs.bind(auditController))
);

/**
 * GET /api/audit/branches/:branchId
 * Obtener logs de auditoría de una sucursal específica
 * Requiere: autenticación, permisos de ADMIN o GERENTE
 */
router.get(
  '/branches/:branchId',
  authenticateToken,
  requireRole('ADMIN', 'GERENTE'),
  param('branchId')
    .isInt({ min: 1 })
    .withMessage('ID de sucursal inválido'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin inválida'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Límite debe estar entre 1 y 200'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset debe ser mayor o igual a 0'),
  validate,
  asyncHandler(auditController.getBranchAuditLogs.bind(auditController))
);

/**
 * GET /api/audit/users/:userId
 * Obtener logs de auditoría de un usuario específico
 * Requiere: autenticación, permisos de ADMIN
 */
router.get(
  '/users/:userId',
  authenticateToken,
  requireRole('ADMIN'),
  param('userId')
    .isInt({ min: 1 })
    .withMessage('ID de usuario inválido'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin inválida'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Límite debe estar entre 1 y 200'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset debe ser mayor o igual a 0'),
  validate,
  asyncHandler(auditController.getUserAuditLogs.bind(auditController))
);

export default router;
