import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middlewares/validation.middleware';
import { authenticateToken } from '../middlewares/auth.middleware';
import { authController } from '../controllers/auth.controller';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

/**
 * POST /api/auth/register
 * Registrar un nuevo usuario en el sistema
 * No requiere autenticación
 *
 * @example
 * POST /api/auth/register
 * Content-Type: application/json
 *
 * {
 *   "username": "juan_123",
 *   "email": "juan@example.com",
 *   "password": "MiPassword123",
 *   "fullName": "Juan García",
 *   "role": "cajero"
 * }
 *
 * @response 201
 * {
 *   "status": "success",
 *   "message": "Usuario registrado exitosamente",
 *   "data": {
 *     "user": { ... },
 *     "accessToken": "...",
 *     "refreshToken": "..."
 *   }
 * }
 */
router.post(
  '/register',
  body('username')
    .notEmpty()
    .withMessage('Usuario requerido')
    .isLength({ min: 3, max: 20 })
    .withMessage('Usuario debe tener entre 3 y 20 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Solo letras, números y guion bajo permitidos'),
  body('email')
    .notEmpty()
    .withMessage('Email requerido')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Contraseña requerida')
    .isLength({ min: 6 })
    .withMessage('Contraseña debe tener al menos 6 caracteres'),
  body('fullName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Nombre muy largo')
    .trim(),
  body('role')
    .optional()
    .isIn(['admin', 'cajero', 'gerente'])
    .withMessage('Rol inválido'),
  validate,
  asyncHandler((req, res, next) => authController.register(req, res, next))
);

/**
 * POST /api/auth/login
 * Autenticar usuario y obtener tokens JWT
 * No requiere autenticación previa
 *
 * @example
 * POST /api/auth/login
 * Content-Type: application/json
 *
 * {
 *   "username": "juan_123",
 *   "password": "MiPassword123"
 * }
 *
 * @response 200
 * {
 *   "status": "success",
 *   "message": "Login exitoso",
 *   "data": {
 *     "user": {
 *       "id": 1,
 *       "username": "juan_123",
 *       "email": "juan@example.com",
 *       "fullName": "Juan García",
 *       "role": "cajero"
 *     },
 *     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 *
 * @error 401
 * {
 *   "status": "error",
 *   "message": "Credenciales inválidas"
 * }
 */
router.post(
  '/login',
  body('username')
    .notEmpty()
    .withMessage('Usuario o email requerido')
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Contraseña requerida'),
  validate,
  asyncHandler((req, res, next) => authController.login(req, res, next))
);

/**
 * POST /api/auth/refresh
 * Refrescar el token de acceso usando un refresh token válido
 * No requiere autenticación con access token
 *
 * @example
 * POST /api/auth/refresh
 * Content-Type: application/json
 *
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 *
 * @response 200
 * {
 *   "status": "success",
 *   "message": "Token refrescado exitosamente",
 *   "data": {
 *     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 *
 * @error 401
 * {
 *   "status": "error",
 *   "message": "Token expirado o inválido"
 * }
 */
router.post(
  '/refresh',
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token requerido'),
  validate,
  asyncHandler((req, res, next) => authController.refreshToken(req, res, next))
);

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado actualmente
 * Requiere autenticación con access token válido
 *
 * @example
 * GET /api/auth/me
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * @response 200
 * {
 *   "status": "success",
 *   "data": {
 *     "user": {
 *       "id": 1,
 *       "username": "juan_123",
 *       "email": "juan@example.com",
 *       "fullName": "Juan García",
 *       "role": "cajero",
 *       "active": true,
 *       "createdAt": "2026-02-05T10:30:00Z",
 *       "updatedAt": "2026-02-05T10:30:00Z"
 *     }
 *   }
 * }
 *
 * @error 401
 * {
 *   "status": "error",
 *   "message": "No autorizado - Token requerido"
 * }
 */
router.get(
  '/me',
  authenticateToken,
  asyncHandler((req, res, next) => authController.getCurrentUser(req, res, next))
);

export default router;

