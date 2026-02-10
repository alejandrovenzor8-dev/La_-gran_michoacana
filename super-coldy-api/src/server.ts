import app from './app.js';
import { disconnectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Servidor corriendo en puerto ${PORT}`);
  logger.info(`📍 http://localhost:${PORT}`);
});

/**
 * Graceful Shutdown
 * Cierra todas las conexiones de forma ordenada
 */
const gracefulShutdown = async (signal: string) => {
  logger.info(`⏹️ Señal ${signal} recibida. Iniciando shutdown graceful...`);

  server.close(async () => {
    logger.info('🛑 Servidor HTTP cerrado');
    
    try {
      await disconnectDatabase();
      logger.info('✅ Shutdown completado exitosamente');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error durante shutdown:', error);
      process.exit(1);
    }
  });

  // Timeout de seguridad: si no cierra en 10 segundos, fuerza cierre
  setTimeout(() => {
    logger.error('❌ Timeout en shutdown graceful. Forzando cierre...');
    process.exit(1);
  }, 10000);
};

// Manejadores de señales
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejador de excepciones no capturadas
process.on('uncaughtException', (error) => {
  logger.error('❌ Excepción no capturada:', error);
  process.exit(1);
});

// Manejador de promesas rechazadas no manejadas
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Promesa rechazada no manejada:', { reason, promise });
  process.exit(1);
});
