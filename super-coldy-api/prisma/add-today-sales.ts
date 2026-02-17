import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTodaySales() {
  const today = new Date();
  
  // Obtener productos
  const products = await prisma.product.findMany({ take: 4 });
  const users = await prisma.user.findMany({ take: 2 });

  if (products.length === 0 || users.length === 0) {
    return;
  }

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
  ];

  for (const saleData of sales) {
    const subtotal = saleData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    await prisma.sale.create({
      data: {
        userId: saleData.userId,
        subtotal,
        total: subtotal,
        discount: 0,
        tax: 0,
        paymentMethod: saleData.paymentMethod as any,
        status: 'COMPLETED',
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

    // Actualizar stock
    for (const item of saleData.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  }

  // Mostrar resumen
  const todaySales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      },
    },
  });
  
  const totalRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.total), 0);
}

addTodaySales()
  .catch(() => {})
  .finally(() => prisma.$disconnect());
