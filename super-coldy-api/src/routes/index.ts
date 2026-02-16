import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import saleRoutes from './sale.routes.js';

const router = Router();

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de usuarios
router.use('/users', userRoutes);

// Rutas de productos
router.use('/products', productRoutes);

// Rutas de ventas
router.use('/sales', saleRoutes);

export default router;
