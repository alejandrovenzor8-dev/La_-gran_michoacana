import prismaClient from '../config/database.js';
import { logger } from './logger.js';
import bcryptjs from 'bcryptjs';

/**
 * Inicializa la base de datos con datos por defecto
 * Solo ejecuta si la BD está vacía (primer deploy)
 */
export async function initializeDatabase() {
  try {
    // Verificar si ya hay usuarios
    const userCount = await prismaClient.user.count();
    
    if (userCount === 0) {
      logger.info('🌱 Inicializando base de datos con datos por defecto...');
      
      // Crear usuario admin
      const hashedPassword = await bcryptjs.hash('admin123', 10);
      
      await prismaClient.user.create({
        data: {
          username: 'admin',
          email: 'admin@supercoldy.com',
          passwordHash: hashedPassword,
          role: 'ADMIN',
          fullName: 'Administrador',
          active: true,
        },
      });
      
      logger.info('✅ Usuario admin creado exitosamente');
      
      // Crear productos de ejemplo
      await prismaClient.product.createMany({
        data: [
          {
            name: 'Franchesco Fresa',
            description: 'Paleta de Fresa',
            category: 'PALETA',
            price: 15,
            cost: 8,
            stock: 100,
            emoji: '🍓',
            active: true,
          },
          {
            name: 'Franchesco Limón',
            description: 'Paleta de Limón',
            category: 'PALETA',
            price: 15,
            cost: 8,
            stock: 100,
            emoji: '🍋',
            active: true,
          },
          {
            name: 'Franchesco Chamoy',
            description: 'Paleta de Chamoy',
            category: 'PALETA',
            price: 18,
            cost: 9,
            stock: 80,
            emoji: '🔥',
            active: true,
          },
          {
            name: 'Franchesco Mango',
            description: 'Paleta de Mango',
            category: 'PALETA',
            price: 15,
            cost: 8,
            stock: 100,
            emoji: '🥭',
            active: true,
          },
        ],
      });
      
      logger.info('✅ 4 productos creados exitosamente');
      logger.info('🚀 Base de datos inicializada correctamente');
    } else {
      logger.info('✅ Base de datos ya contiene datos, inicialización omitida');
    }
  } catch (error) {
    logger.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
}
