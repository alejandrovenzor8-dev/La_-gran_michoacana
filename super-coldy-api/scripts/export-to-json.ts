import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Exporta todos los datos de la base de datos a archivos JSON
 * Útil para backup o migración de datos
 */
async function exportToJSON() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const exportDir = path.join(process.cwd(), 'exports', `export_${timestamp}`);
    
    // Crear directorio de exportación
    await fs.mkdir(exportDir, { recursive: true });

    // Exportar usuarios (sin passwords)
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

    // Exportar productos
    const products = await prisma.product.findMany();
    await fs.writeFile(
      path.join(exportDir, 'products.json'),
      JSON.stringify(products, null, 2)
    );

    // Exportar ventas
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

    // Exportar movimientos de inventario
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
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
exportToJSON()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
