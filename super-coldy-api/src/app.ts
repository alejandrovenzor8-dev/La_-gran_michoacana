// Database configuration trigger
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import routes from './routes/index.js';

dotenv.config();

const app: Express = express();

// Conectar a la base de datos (no debe bloquear el startup del servidor)
connectDatabase().catch((error) => {
  logger.warn('⚠️ Advertencia: No se pudo conectar a la base de datos en startup', {
    message: error instanceof Error ? error.message : 'Error desconocido',
  });
  logger.warn('El servidor continuará ejecutándose. La conexión se intentará en las próximas peticiones.');
});

// Middlewares de seguridad
app.use(helmet());
app.use(cors());

// Logging
app.use(morgan('dev'));

// Body parser - aumentado a 10mb para soportar imágenes en base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// RUTAS
// ============================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Todas las rutas
app.use('/api', routes);

// Log de rutas registradas
logger.info('✅ Rutas registradas:', {
  '/api/auth': 'Login, registro, refresh token',
  '/api/users': 'CRUD de usuarios (protegido)',
  '/api/products': 'CRUD de productos (protegido)',
  '/api/sales': 'CRUD de ventas (protegido)',
  '/api/inventory': 'Gestión de inventario (protegido)',
  '/api/permissions': 'Permisos y módulos (protegido)',
  '/api/settings': 'Configuración del sistema (admin)',
  '/api/branches': 'Gestión de sucursales (admin)',
  '/api/audit': 'Logs de auditoría (admin/gerente)',
});

// ============================================================
// MANEJO DE ERRORES
// ============================================================

// Middleware para rutas no encontradas (debe ir antes del errorHandler)
app.use(notFound);

// Middleware global de errores (debe ser el último)
app.use(errorHandler);

export default app;
