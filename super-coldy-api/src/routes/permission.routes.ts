import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { permissionController } from '../controllers/permission.controller.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// GET /api/modules - Obtener todos los módulos disponibles
router.get(
  '/modules',
  asyncHandler(permissionController.getAllModules.bind(permissionController))
);

// GET /api/permissions/user/:userId - Obtener permisos de un usuario por ID
router.get(
  '/user/:userId',
  asyncHandler(permissionController.getUserPermissions.bind(permissionController))
);

// GET /api/permissions/username/:username - Obtener permisos de un usuario por username
router.get(
  '/username/:username',
  asyncHandler(permissionController.getUserPermissionsByUsername.bind(permissionController))
);

// PUT /api/permissions/user/:userId - Actualizar permisos de un usuario por ID
router.put(
  '/user/:userId',
  asyncHandler(permissionController.updateUserPermissions.bind(permissionController))
);

// PUT /api/permissions/username/:username - Actualizar permisos de un usuario por username
router.put(
  '/username/:username',
  asyncHandler(permissionController.updateUserPermissionsByUsername.bind(permissionController))
);

export { router as permissionRoutes };
