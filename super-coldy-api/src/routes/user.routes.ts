import { Router } from 'express';
import { param, body } from 'express-validator';
import { validate } from '../middlewares/validation.middleware.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { userController } from '../controllers/user.controller.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = Router();

// Aplicar autenticación a todas las rutas de usuarios
router.use(authenticateToken);

/**
 * GET /api/users
 * Obtener lista de todos los usuarios
 * Requiere autenticación
 *
 * @query limit - Límite de resultados (default: 10)
 * @query offset - Offset para paginación (default: 0)
 *
 * @example
 * GET /api/users?limit=20&offset=0
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * @response 200
 * {
 *   "status": "success",
 *   "data": {
 *     "users": [...],
 *     "pagination": { "total": 100, "limit": 10, "offset": 0, "pages": 10 }
 *   }
 * }
 */
router.get(
  '/',
  asyncHandler((req, res, next) => userController.getAllUsers(req, res, next))
);

/**
 * GET /api/users/:id
 * Obtener usuario por ID
 * Requiere autenticación
 *
 * @param id - ID del usuario
 *
 * @example
 * GET /api/users/1
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * @response 200
 * {
 *   "status": "success",
 *   "data": {
 *     "user": { ... }
 *   }
 * }
 *
 * @error 404
 * {
 *   "status": "error",
 *   "message": "Usuario no encontrado"
 * }
 */
router.get(
  '/:id',
  param('id').isInt().withMessage('ID debe ser un número entero'),
  validate,
  asyncHandler((req, res, next) => userController.getUserById(req, res, next))
);

/**
 * PUT /api/users/:id
 * Actualizar usuario
 * Requiere autenticación (admin o el mismo usuario)
 *
 * @param id - ID del usuario a actualizar
 * @body
 * {
 *   "email": "nuevo@example.com",
 *   "fullName": "Nuevo Nombre",
 *   "role": "gerente",
 *   "active": true
 * }
 *
 * @example
 * PUT /api/users/1
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * {
 *   "fullName": "Juan García García"
 * }
 *
 * @response 200
 * {
 *   "status": "success",
 *   "message": "Usuario actualizado exitosamente",
 *   "data": { "user": { ... } }
 * }
 */
router.put(
  '/:id',
  param('id').isInt().withMessage('ID debe ser un número entero'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('fullName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Nombre muy largo')
    .trim(),
  body('role')
    .optional()
    .isIn(['admin', 'cajero', 'gerente', 'ADMIN', 'CAJERO', 'GERENTE'])
    .withMessage('Rol inválido'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active debe ser booleano'),
  validate,
  asyncHandler((req, res, next) => userController.updateUser(req, res, next))
);

/**
 * DELETE /api/users/:id
 * Eliminar usuario
 * Requiere autenticación (admin)
 *
 * @param id - ID del usuario a eliminar
 *
 * @example
 * DELETE /api/users/1
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * @response 200
 * {
 *   "status": "success",
 *   "message": "Usuario eliminado exitosamente"
 * }
 *
 * @error 404
 * {
 *   "status": "error",
 *   "message": "Usuario no encontrado"
 * }
 *
 * @error 400
 * {
 *   "status": "error",
 *   "message": "No se puede eliminar el único administrador"
 * }
 */
router.delete(
  '/:id',
  param('id').isInt().withMessage('ID debe ser un número entero'),
  validate,
  asyncHandler((req, res, next) => userController.deleteUser(req, res, next))
);

export default router;
