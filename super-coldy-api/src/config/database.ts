import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

// Tipos para la instancia de Prisma
type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

// Crear instancia singleton de PrismaClient
const prismaClientSingleton = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Configurar logs según el ambiente
  const logConfig: Prisma.PrismaClientOptions['log'] = isDevelopment
    ? [
        { level: 'query', emit: 'event' },
        { level: 'info', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
        { level: 'error', emit: 'stdout' },
      ]
    : [
        { level: 'warn', emit: 'stdout' },
        { level: 'error', emit: 'stdout' },
      ];

  const client = new PrismaClient({
    log: logConfig,
  });

  // En desarrollo, registrar eventos de query para debugging
  if (isDevelopment) {
    client.$on('query', (e: Prisma.QueryEvent) => {
      logger.debug(`[DB Query] ${e.query}`, {
        duration: `${e.duration}ms`,
        params: e.params,
      });
    });
  }

  return client;
};

// Evitar múltiples instancias en desarrollo (hot reload)
declare global {
  var prisma: PrismaClientSingleton | undefined;
}

const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Conectar a la base de datos
 * En producción, la conexión se establece automáticamente
 * En desarrollo, se puede usar explícitamente si es necesario
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('✅ Conectado a la base de datos');
  } catch (error) {
    logger.error('❌ Error conectando a la base de datos:', error);
    throw error;
  }
};

/**
 * Desconectar de la base de datos gracefully
 * Debe ser llamado cuando la aplicación se cierra
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('✅ Desconectado de la base de datos');
  } catch (error) {
    logger.error('❌ Error desconectando de la base de datos:', error);
    throw error;
  }
};

export default prisma;
