import { PrismaClient, UserRole, PaymentMethod, SaleStatus, Source, InventoryMovementType, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Limpiar datos existentes
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.module.deleteMany();
  await prisma.config.deleteMany();
  await prisma.branch.deleteMany();

  // Crear sucursales
  const cedisBranch = await prisma.branch.create({
    data: {
      name: 'Cedis',
      address: 'Centro de Distribución',
      phone: '555-0100',
      active: true,
    },
  });

  const sucursal1Branch = await prisma.branch.create({
    data: {
      name: 'Sucursal 1',
      address: 'Av. Principal #123',
      phone: '555-0101',
      active: true,
    },
  });

  // Crear usuarios
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@supercoldy.com',
      passwordHash: hashedPassword,
      fullName: 'Administrator',
      role: UserRole.ADMIN,
      branchId: cedisBranch.id,
      active: true,
    },
  });

  const cajeraUser = await prisma.user.create({
    data: {
      username: 'cajera1',
      email: 'cajera1@supercoldy.com',
      passwordHash: hashedPassword,
      fullName: 'María García',
      role: UserRole.CAJERO,
      branchId: sucursal1Branch.id,
      active: true,
    },
  });

  // Crear módulos del sistema
  
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
        description: 'Administración de sucursales del sistema',
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
        key: 'permissions',
        name: 'Permisos y Seguridad',
        description: 'Gestión de permisos de usuarios',
        icon: 'Shield',
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
    prisma.module.create({
      data: {
        key: 'audit',
        name: 'Auditoría',
        description: 'Historial de cambios y seguimiento de acciones',
        icon: 'FileText',
        active: true,
      },
    }),
  ]);

  // Asignar permisos a usuarios

  // Admin: Todos los permisos
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

  // Cajera: Solo POS y Reportes
  const cajeraModules = modules.filter((m) => ['pos', 'reports'].includes(m.key));
  await Promise.all(
    cajeraModules.map((module) =>
      prisma.permission.create({
        data: {
          userId: cajeraUser.id,
          moduleId: module.id,
          granted: true,
        },
      })
    )
  );

  // Crear productos
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Paleta de Fresa',
        description: 'Deliciosa paleta de fresa natural',
        price: 15.00,
        cost: 5.00,
        category: 'Sabores Clásicos',
        stock: 100,
        minStock: 10,
        barcode: 'FRESA001',
        emoji: '🍓',
        branchId: sucursal1Branch.id,
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Paleta de Chamoy',
        description: 'Paleta de chamoy picosita',
        price: 15.00,
        cost: 5.00,
        category: 'Sabores Especiales',
        stock: 80,
        minStock: 10,
        barcode: 'CHAMOY001',
        emoji: '🌶️',
        branchId: sucursal1Branch.id,
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Paleta de Limón',
        description: 'Refrescante paleta de limón',
        price: 12.00,
        cost: 4.00,
        category: 'Sabores Clásicos',
        stock: 150,
        minStock: 20,
        barcode: 'LIMON001',
        emoji: '🍋',
        branchId: sucursal1Branch.id,
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Paleta de Coco',
        description: 'Exótica paleta de coco',
        price: 18.00,
        cost: 6.00,
        category: 'Sabores Premium',
        stock: 50,
        minStock: 5,
        barcode: 'COCO001',
        emoji: '🥥',
        branchId: sucursal1Branch.id,
        active: true,
      },
    }),
  ]);

  // ==========================================
  // 3. CONFIGURACIONES DEL SISTEMA
  // ==========================================
  // NOTA: Se removieron las ventas de ejemplo para evitar datos de prueba en producción

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
}

main()
  .catch((e) => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
