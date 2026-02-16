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

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// ============================================================
// MANEJO DE ERRORES
// ============================================================

// Middleware para rutas no encontradas (debe ir antes del errorHandler)
app.use(notFound);

// Middleware global de errores (debe ser el último)
app.use(errorHandler);

export default app;
