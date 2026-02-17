import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

// Rutas de autenticación (sin protección en algunas)
router.use('/auth', authRoutes);

// Rutas de usuarios (protegidas)
router.use('/users', userRoutes);

export default router;
