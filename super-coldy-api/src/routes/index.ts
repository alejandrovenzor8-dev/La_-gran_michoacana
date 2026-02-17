import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import saleRoutes from './sale.routes.js';
import { permissionRoutes } from './permission.routes.js';

const router = Router();

// Rutas de autenticación (sin protección en algunas)
router.use('/auth', authRoutes);

// Rutas de usuarios (protegidas)
router.use('/users', userRoutes);

// Rutas de productos (protegidas)
router.use('/products', productRoutes);

// Rutas de ventas (protegidas)
router.use('/sales', saleRoutes);

// Rutas de permisos y módulos (protegidas)
router.use('/permissions', permissionRoutes);

export default router;
