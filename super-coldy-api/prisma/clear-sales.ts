/**
 * Script para limpiar todas las ventas de la base de datos
 * Uso: npx ts-node prisma/clear-sales.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearSales() {
  try {
    console.log('🗑️  Iniciando limpieza de ventas...');

    // Primero eliminar los items de venta (debido a la relación)
    const deletedItems = await prisma.saleItem.deleteMany({});
    console.log(`✅ Eliminados ${deletedItems.count} items de venta`);

    // Luego eliminar las ventas
    const deletedSales = await prisma.sale.deleteMany({});
    console.log(`✅ Eliminadas ${deletedSales.count} ventas`);

    // También limpiar movimientos de inventario relacionados con ventas
    const deletedMovements = await prisma.inventoryMovement.deleteMany({
      where: {
        type: 'VENTA'
      }
    });
    console.log(`✅ Eliminados ${deletedMovements.count} movimientos de inventario`);

    console.log('✨ Base de datos limpiada exitosamente');
  } catch (error) {
    console.error('❌ Error al limpiar ventas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearSales()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
