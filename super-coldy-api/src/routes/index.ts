import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import saleRoutes from './sale.routes.js';
import inventoryRoutes from './inventory.routes.js';
import { permissionRoutes } from './permission.routes.js';
import settingsRoutes from './settings.routes.js';

const router = Router();

// Rutas de autenticación (sin protección en algunas)
router.use('/auth', authRoutes);

// Rutas de usuarios (protegidas)
router.use('/users', userRoutes);

// Rutas de productos (protegidas)
router.use('/products', productRoutes);

// Rutas de ventas (protegidas)
router.use('/sales', saleRoutes);

// Rutas de inventario (protegidas)
router.use('/inventory', inventoryRoutes);

// Rutas de permisos y módulos (protegidas)
router.use('/permissions', permissionRoutes);

// Rutas de configuración del sistema (protegidas, solo admin)
router.use('/settings', settingsRoutes);

export default router;
