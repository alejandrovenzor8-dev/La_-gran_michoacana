import { PrismaClient, UserRole, PaymentMethod, SaleStatus, Source } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // Limpiar datos existentes
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.config.deleteMany();

  // Crear usuarios
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@supercoldy.com',
      passwordHash: hashedPassword,
      fullName: 'Administrator',
      role: UserRole.ADMIN,
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
      active: true,
    },
  });

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
        active: true,
      },
    }),
  ]);

  // Crear configuraciones
  await prisma.config.create({
    data: {
      key: 'TAX_RATE',
      value: '0.16',
    },
  });

  await prisma.config.create({
    data: {
      key: 'BUSINESS_NAME',
      value: 'La Gran Michoacana - Super Coldy',
    },
  });

  console.log('✅ Seed completado exitosamente');
  console.log(`📊 ${products.length} productos creados`);
  console.log(`👥 2 usuarios creados`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
