import { PrismaClient, SaleStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function addTodaySales() {
  try {
    // Obtener la fecha actual en hora local (sin conversión a UTC)
    // Las ventas deben guardarse con la hora actual del sistema
    const now = new Date();
    
    console.log(`📅 Creando ventas para: ${now.toISOString()}`);
    console.log(`   Hora local: ${now.toLocaleString('es-MX')}`);


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
          createdAt: today,
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
      console.log(`✅ Venta creada: $${subtotal.toFixed(2)} (${saleData.items.length} items)`);

      // Actualizar stock
      for (const item of saleData.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    // Mostrar resumen
    const todaySalesCheck = await prisma.sale.findMany({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            0, 0, 0, 0
          )),
          lte: new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            23, 59, 59, 999
          )),
        },
      },
      include: { items: true },
    });
    
    const totalRevenue = todaySalesCheck.reduce((sum, sale) => sum + Number(sale.total), 0);
    
    console.log(`\n📊 Resumen de ventas de hoy:`);
    console.log(`   Total de ventas: ${todaySalesCheck.length}`);
    console.log(`   Total de ingresos: $${totalRevenue.toFixed(2)}`);
    console.log(`   Primera venta: ${todaySalesCheck[0]?.createdAt.toISOString()}`);
    console.log(`   Última venta: ${todaySalesCheck[todaySalesCheck.length - 1]?.createdAt.toISOString()}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTodaySales();
