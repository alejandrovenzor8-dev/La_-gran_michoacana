import { PrismaClient, UserRole, AuditAction } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando limpieza de base de datos...');

  // 1. Eliminar auditoría
  console.log('❌ Eliminando logs de auditoría...');
  await prisma.auditLog.deleteMany();
  console.log('✅ Logs de auditoría eliminados');

  // 2. Eliminar todas las ventas y sus items
  console.log('❌ Eliminando ventas...');
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  console.log('✅ Ventas eliminadas');

  // 3. Eliminar todos los movimientos de inventario
  console.log('❌ Eliminando movimientos de inventario...');
  await prisma.inventoryMovement.deleteMany();
  console.log('✅ Movimientos de inventario eliminados');

  // 4. Eliminar todos los productos
  console.log('❌ Eliminando productos...');
  await prisma.product.deleteMany();
  console.log('✅ Productos eliminados');

  // 5. Eliminar permisos
  console.log('❌ Eliminando permisos...');
  await prisma.permission.deleteMany();
  console.log('✅ Permisos eliminados');

  // 6. Eliminar todos los usuarios
  console.log('❌ Eliminando usuarios...');
  await prisma.user.deleteMany();
  console.log('✅ Usuarios eliminados');

  // 7. Eliminar módulos
  console.log('❌ Eliminando módulos...');
  await prisma.module.deleteMany();
  console.log('✅ Módulos eliminados');

  // 8. Eliminar configuraciones
  console.log('❌ Eliminando configuraciones...');
  await prisma.config.deleteMany();
  console.log('✅ Configuraciones eliminadas');

  // 9. Eliminar todas las sucursales
  console.log('❌ Eliminando sucursales...');
  await prisma.branch.deleteMany();
  console.log('✅ Sucursales eliminadas');

  console.log('\n🔨 Creando datos base...\n');

  // 10. Crear UNA sucursal con caja inicial
  console.log('📍 Creando sucursal principal...');
  const branch = await prisma.branch.create({
    data: {
      name: 'Sucursal Principal',
      address: 'Dirección Principal',
      phone: '555-0100',
      initialCash: 500.00, // Monto inicial de caja
      active: true,
    },
  });
  console.log(`✅ Sucursal creada: ${branch.name} (ID: ${branch.id})`);
  console.log(`   💵 Caja inicial: $${branch.initialCash}`);

  // 11. Crear UN usuario admin
  console.log('👤 Creando usuario admin...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@supercoldy.com',
      passwordHash: hashedPassword,
      fullName: 'Administrador',
      role: UserRole.ADMIN,
      branchId: branch.id,
      active: true,
    },
  });
  console.log(`✅ Usuario admin creado: ${adminUser.username} (${adminUser.email})`);
  console.log(`   🔑 Contraseña: admin123`);

  // 12. Crear módulos base del sistema
  console.log('📦 Creando módulos del sistema...');
  const modules = await Promise.all([
    prisma.module.create({
      data: {
        key: 'pos',
        name: 'Punto de Venta',
        description: 'Gestión de ventas y cobros',
        icon: 'ShoppingCart',
        active: true,
      },
    }),
    prisma.module.create({
      data: {
        key: 'inventory',
        name: 'Inventario',
        description: 'Control de productos y stock',
        icon: 'Package',
        active: true,
      },
    }),
    prisma.module.create({
      data: {
        key: 'users',
        name: 'Gestión de Usuarios',
        description: 'Administración de usuarios del sistema',
        icon: 'Users',
        active: true,
      },
    }),
    prisma.module.create({
      data: {
        key: 'branches',
        name: 'Gestión de Sucursales',
        description: 'Administración de sucursales',
        icon: 'Building',
        active: true,
      },
    }),
    prisma.module.create({
      data: {
        key: 'settings',
        name: 'Configuración',
        description: 'Ajustes generales del sistema',
        icon: 'Settings',
        active: true,
      },
    }),
    prisma.module.create({
      data: {
        key: 'reports',
        name: 'Reportes',
        description: 'Reportes de ventas y cortes de caja',
        icon: 'BarChart',
        active: true,
      },
    }),
  ]);
  console.log(`✅ ${modules.length} módulos creados`);

  // 13. Asignar todos los permisos al admin
  console.log('🔐 Asignando permisos al admin...');
  await Promise.all(
    modules.map((module) =>
      prisma.permission.create({
        data: {
          userId: adminUser.id,
          moduleId: module.id,
          granted: true,
        },
      })
    )
  );
  console.log(`✅ ${modules.length} permisos asignados al admin`);

  // 14. Crear UN producto: Paleta de Agua
  console.log('🍭 Creando producto: Paleta de Agua...');
  const product = await prisma.product.create({
    data: {
      name: 'Paleta de Agua',
      description: 'Paleta de agua de sabor natural',
      price: 12.00,
      cost: 4.00,
      category: 'Paletas de Agua',
      stock: 0, // Sin inventario inicial
      minStock: 10,
      barcode: 'AGUA001',
      emoji: '🧊',
      branchId: branch.id,
      active: true,
    },
  });
  console.log(`✅ Producto creado: ${product.name} (ID: ${product.id})`);
  console.log(`   💰 Precio: $${product.price}`);
  console.log(`   📦 Stock: ${product.stock}`);

  // 15. Crear configuraciones del sistema
  console.log('⚙️  Creando configuraciones del sistema...');
  await prisma.config.create({
    data: {
      key: 'TAX_RATE',
      value: '0.16',
    },
  });
  await prisma.config.create({
    data: {
      key: 'BUSINESS_NAME',
      value: 'La Gran Michoacana',
    },
  });
  console.log('✅ Configuraciones creadas');

  // 16. Crear log inicial de auditoría
  console.log('📝 Creando log de auditoría inicial...');
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      branchId: branch.id,
      action: AuditAction.CREATE,
      entity: 'Database',
      description: 'Base de datos inicializada con datos base',
      newValues: JSON.stringify({
        branch: branch.name,
        product: product.name,
        initialCash: branch.initialCash,
      }),
    },
  });
  console.log('✅ Log de auditoría creado');

  console.log('\n✨ ¡Base de datos limpiada exitosamente!\n');
  console.log('📊 Resumen:');
  console.log('   ✅ 1 Sucursal: Sucursal Principal (Caja inicial: $500.00)');
  console.log('   ✅ 1 Usuario: admin (admin@supercoldy.com) - Contraseña: admin123');
  console.log('   ✅ 1 Producto: Paleta de Agua (sin stock)');
  console.log('   ✅ 0 Ventas');
  console.log('   ✅ 0 Movimientos de inventario');
  console.log('   ✅ Sistema de auditoría activo');
}

main()
  .catch((e) => {
    console.error('❌ Error al limpiar la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
