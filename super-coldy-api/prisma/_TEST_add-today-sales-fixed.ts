import { PrismaClient, SaleStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function addTodaySales() {
  try {
    // Usar la fecha actual directamente (sin conversiones UTC)
    const now = new Date();
    
    console.log(`📅 Creando ventas para: ${now.toLocaleString('es-MX')}`);
    
    // Obtener productos
    const products = await prisma.product.findMany({ 
      where: { active: true },
      take: 4 
    });
    const users = await prisma.user.findMany({ take: 2 });

    if (products.length === 0 || users.length === 0) {
      console.log('❌ No hay productos o usuarios disponibles');
      return;
    }

    console.log(`✅ Encontrados ${products.length} productos y ${users.length} usuarios`);

    // Crear varias ventas para hoy
    const sales = [
      {
        userId: users[0].id,
        items: [
          { productId: products[0].id, quantity: 3, unitPrice: Number(products[0].price) },
          { productId: products[1].id, quantity: 2, unitPrice: Number(products[1].price) },
        ],
        paymentMethod: 'EFECTIVO',
      },
      {
        userId: users[1].id,
        items: [
          { productId: products[2].id, quantity: 5, unitPrice: Number(products[2].price) },
        ],
        paymentMethod: 'TARJETA',
      },
      {
        userId: users[0].id,
        items: [
          { productId: products[3].id, quantity: 2, unitPrice: Number(products[3].price) },
          { productId: products[0].id, quantity: 1, unitPrice: Number(products[0].price) },
        ],
        paymentMethod: 'EFECTIVO',
      },
      {
        userId: users[1].id,
        items: [
          { productId: products[1].id, quantity: 1, unitPrice: Number(products[1].price) },
          { productId: products[2].id, quantity: 2, unitPrice: Number(products[2].price) },
        ],
        paymentMethod: 'TARJETA',
      },
      {
        userId: users[0].id,
        items: [
          { productId: products[3].id, quantity: 1, unitPrice: Number(products[3].price) },
        ],
        paymentMethod: 'EFECTIVO',
      },
    ];

    let totalCreated = 0;
    let totalRevenue = 0;

    for (const saleData of sales) {
      const subtotal = saleData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      
      const sale = await prisma.sale.create({
        data: {
          userId: saleData.userId,
          subtotal,
          total: subtotal,
          discount: 0,
          tax: 0,
          paymentMethod: saleData.paymentMethod as any,
          status: SaleStatus.COMPLETED,
          source: 'DESKTOP',
          createdAt: now,
          items: {
            create: saleData.items.map(item => ({
              productId: item.productId,
              productName: products.find(p => p.id === item.productId)?.name || '',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.quantity * item.unitPrice,
              discount: 0,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      totalCreated++;
      totalRevenue += subtotal;
      console.log(`✅ Venta creada: $${subtotal.toFixed(2)} (${saleData.items.length} items)`);

      // Actualizar stock
      for (const item of saleData.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   Ventas creadas: ${totalCreated}`);
    console.log(`   Ingresos totales: $${totalRevenue.toFixed(2)}`);
    console.log(`   Fecha de las ventas: ${now.toLocaleString('es-MX')}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTodaySales();
