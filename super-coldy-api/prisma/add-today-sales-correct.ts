import { PrismaClient, SaleStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function addTodaySalesUTC() {
  try {
    // Obtener la fecha actual y convertirla correctamente a UTC
    // Para Feb 18, 2026 a las 15:00 (hora México Central)
    // Necesitamos Feb 18, 21:00 UTC (porque México es UTC-6)
    
    const now = new Date();
    
    // Crear una fecha UTC que represente hoy en Mexico City timezone
    // México está en UTC-6
    const offset = 6; // horas
    const utcDate = new Date(now.getTime() + (offset * 60 * 60 * 1000));
    
    // Resetear a inicio del día en UTC
    utcDate.setUTCHours(12, 0, 0, 0); // Mediodía UTC = 6am en México
    
    console.log(`📅 Hora local actual: ${now.toLocaleString('es-MX')}`);
    console.log(`📅 Hora UTC: ${utcDate.toUTCString()}`);
    console.log(`📅 Creando ventas para: ${utcDate.toISOString()}`);
    
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

    console.log(`✅ Encontrados ${products.length} productos y ${users.length} usuarios\n`);

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

    for (let i = 0; i < sales.length; i++) {
      const saleData = sales[i];
      const subtotal = saleData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      
      // Variar el tiempo de las ventas
      const saleTime = new Date(utcDate);
      saleTime.setUTCHours(saleTime.getUTCHours() + i); // Desfasar cada venta una hora
      
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
          createdAt: saleTime,
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
      console.log(`✅ Venta ${i + 1} creada: $${subtotal.toFixed(2)} a ${saleTime.toISOString()}`);

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
    console.log(`\n✨ Todas las ventas se crearon en UTC correctamente`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTodaySalesUTC();
