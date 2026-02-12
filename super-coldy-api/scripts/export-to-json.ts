import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Exporta todos los datos de la base de datos a archivos JSON
 * Útil para backup o migración de datos
 */
async function exportToJSON() {
  console.log('📦 Exportando base de datos a JSON...\n');

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const exportDir = path.join(process.cwd(), 'exports', `export_${timestamp}`);
    
    // Crear directorio de exportación
    await fs.mkdir(exportDir, { recursive: true });
    console.log(`📁 Directorio creado: ${exportDir}\n`);

    // Exportar usuarios (sin passwords)
    console.log('👥 Exportando usuarios...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    await fs.writeFile(
      path.join(exportDir, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    console.log(`   ✅ ${users.length} usuarios exportados`);

    // Exportar productos
    console.log('📦 Exportando productos...');
    const products = await prisma.product.findMany();
    await fs.writeFile(
      path.join(exportDir, 'products.json'),
      JSON.stringify(products, null, 2)
    );
    console.log(`   ✅ ${products.length} productos exportados`);

    // Exportar ventas
    console.log('💰 Exportando ventas...');
    const sales = await prisma.sale.findMany({
      include: {
        items: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          }
        }
      }
    });
    await fs.writeFile(
      path.join(exportDir, 'sales.json'),
      JSON.stringify(sales, null, 2)
    );
    console.log(`   ✅ ${sales.length} ventas exportadas`);

    // Exportar movimientos de inventario
    console.log('📊 Exportando movimientos de inventario...');
    const inventoryMovements = await prisma.inventoryMovement.findMany({
      include: {
        product: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          }
        }
      }
    });
    await fs.writeFile(
      path.join(exportDir, 'inventory_movements.json'),
      JSON.stringify(inventoryMovements, null, 2)
    );
    console.log(`   ✅ ${inventoryMovements.length} movimientos exportados`);

    // Crear resumen
    const summary = {
      exportDate: new Date().toISOString(),
      tables: {
        users: users.length,
        products: products.length,
        sales: sales.length,
        inventoryMovements: inventoryMovements.length,
      },
      totalRecords: users.length + products.length + sales.length + inventoryMovements.length,
    };

    await fs.writeFile(
      path.join(exportDir, '_summary.json'),
      JSON.stringify(summary, null, 2)
    );

    // Calcular tamaño total
    const files = await fs.readdir(exportDir);
    let totalSize = 0;
    for (const file of files) {
      const stats = await fs.stat(path.join(exportDir, file));
      totalSize += stats.size;
    }

    console.log('\n✅ ¡Exportación completada!');
    console.log('========================================');
    console.log(`📁 Directorio: ${exportDir}`);
    console.log(`📊 Total registros: ${summary.totalRecords}`);
    console.log(`💾 Tamaño total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('========================================\n');

    console.log('📋 Archivos creados:');
    for (const file of files) {
      const stats = await fs.stat(path.join(exportDir, file));
      console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    }

  } catch (error) {
    console.error('❌ Error durante la exportación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
exportToJSON()
  .then(() => {
    console.log('\n✨ Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
