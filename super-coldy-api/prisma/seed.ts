import { PrismaClient, UserRole, PaymentMethod, SaleStatus, Source, InventoryMovementType, Prisma } from '@prisma/client';
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

  // ==========================================
  // 3. CREAR VENTAS DE EJEMPLO
  // ==========================================
  console.log('🛒 Creando ventas de ejemplo...');

  // Venta 1: Admin compra 2 productos con efectivo
  const sale1Items = [
    {
      productId: products[0].id,
      productName: products[0].name,
      quantity: 2,
      unitPrice: Number(products[0].price),
      subtotal: Number(products[0].price) * 2,
      discount: 0,
    },
    {
      productId: products[1].id,
      productName: products[1].name,
      quantity: 1,
      unitPrice: Number(products[1].price),
      subtotal: Number(products[1].price),
      discount: 0,
    },
  ];

  const sale1Subtotal = sale1Items.reduce((sum, item) => sum + item.subtotal, 0);
  const sale1Total = sale1Subtotal;

  const sale1 = await prisma.sale.create({
    data: {
      userId: adminUser.id,
      subtotal: sale1Subtotal,
      total: sale1Total,
      discount: 0,
      tax: 0,
      paymentMethod: PaymentMethod.EFECTIVO,
      amountReceived: sale1Total + 20, // Cliente dio $20 de más
      changeAmount: 20,
      status: SaleStatus.COMPLETED,
      source: Source.DESKTOP,
      notes: 'Venta de ejemplo - Efectivo',
      items: {
        createMany: {
          data: sale1Items,
        },
      },
    },
  });

  // Actualizar stock después de venta 1
  for (const item of sale1Items) {
    const product = products.find((p) => p.id === item.productId)!;
    const previousStock = product.stock;

    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stock: { decrement: item.quantity },
      },
    });

    await prisma.inventoryMovement.create({
      data: {
        productId: item.productId,
        userId: adminUser.id,
        type: InventoryMovementType.SALIDA,
        quantity: -item.quantity,
        previousStock: previousStock,
        newStock: previousStock - item.quantity,
        reason: `Venta #${sale1.id}`,
        referenceId: sale1.id,
      },
    });
  }

  console.log(`✅ Venta 1 creada: ${sale1.id} (${sale1Items.length} items, Total: $${sale1Total})`);

  // Venta 2: Cajero vende con tarjeta
  const sale2Items = [
    {
      productId: products[2].id,
      productName: products[2].name,
      quantity: 3,
      unitPrice: Number(products[2].price),
      subtotal: Number(products[2].price) * 3,
      discount: 0,
    },
  ];

  const sale2Subtotal = sale2Items.reduce((sum, item) => sum + item.subtotal, 0);
  const sale2Total = sale2Subtotal;

  const sale2 = await prisma.sale.create({
    data: {
      userId: cajeraUser.id,
      subtotal: sale2Subtotal,
      total: sale2Total,
      discount: 0,
      tax: 0,
      paymentMethod: PaymentMethod.TARJETA,
      status: SaleStatus.COMPLETED,
      source: Source.DESKTOP,
      notes: 'Venta de ejemplo - Tarjeta',
      items: {
        createMany: {
          data: sale2Items,
        },
      },
    },
  });

  // Actualizar stock después de venta 2
  for (const item of sale2Items) {
    const product = products.find((p) => p.id === item.productId)!;
    const previousStock = product.stock;

    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stock: { decrement: item.quantity },
      },
    });

    await prisma.inventoryMovement.create({
      data: {
        productId: item.productId,
        userId: cajeraUser.id,
        type: InventoryMovementType.SALIDA,
        quantity: -item.quantity,
        previousStock: previousStock,
        newStock: previousStock - item.quantity,
        reason: `Venta #${sale2.id}`,
        referenceId: sale2.id,
      },
    });
  }

  console.log(`✅ Venta 2 creada: ${sale2.id} (${sale2Items.length} items, Total: $${sale2Total})`);
  console.log('✅ Ventas de ejemplo creadas exitosamente');
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
