import { Router, Request, Response, NextFunction } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Rutas de usuarios
 * Las rutas de lectura (GET) son públicas
 * Las rutas de modificación requieren autenticación
 */

// GET /api/users/stats/overview - Estadísticas de usuarios (público)
router.get('/stats/overview', userController.getUserStats.bind(userController));

// GET /api/users - Obtener todos los usuarios (público)
router.get('/', userController.getAllUsers.bind(userController));

// GET /api/users/:id - Obtener usuario por ID (público)
router.get('/:id', userController.getUserById.bind(userController));

// POST /api/users - Crear nuevo usuario (requiere autenticación)
router.post(
  '/',
  authMiddleware,
  userController.createUser.bind(userController)
);

// PUT /api/users/:id - Actualizar usuario (requiere autenticación)
router.put('/:id', authMiddleware, userController.updateUser.bind(userController));

// DELETE /api/users/:id - Desactivar usuario (requiere autenticación)
router.delete('/:id', authMiddleware, userController.deleteUser.bind(userController));

// PATCH /api/users/:id/activate - Activar usuario (requiere autenticación)
router.patch('/:id/activate', authMiddleware, userController.activateUser.bind(userController));

export default router;
