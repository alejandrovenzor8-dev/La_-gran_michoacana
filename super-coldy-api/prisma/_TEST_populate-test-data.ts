import { PrismaClient, PaymentMethod, SaleStatus, Source, InventoryMovementType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Obtener usuario admin
  const admin = await prisma.user.findFirst({
    where: { username: 'admin' }
  });

  if (!admin) {
    return;
  }

  // Obtener productos
  const products = await prisma.product.findMany({
    where: { active: true }
  });

  if (products.length === 0) {
    return;
  }

  const today = new Date();
  const salesData = [];

  // Generar ventas para los últimos 30 días
  for (let i = 0; i < 30; i++) {
    const saleDate = new Date(today);
    saleDate.setDate(today.getDate() - i);
    
    // Número aleatorio de ventas por día (entre 2 y 8)
    const salesPerDay = Math.floor(Math.random() * 7) + 2;
    
    for (let j = 0; j < salesPerDay; j++) {
      // Seleccionar productos aleatorios (1-3 items por venta)
      const itemsCount = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let subtotal = 0;

      for (let k = 0; k < itemsCount; k++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const itemSubtotal = Number(product.price) * quantity;
        
        items.push({
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: Number(product.price),
          subtotal: itemSubtotal,
          discount: 0,
        });

        subtotal += itemSubtotal;
      }

      const paymentMethods: PaymentMethod[] = ['EFECTIVO', 'TARJETA', 'MIXTO'];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      salesData.push({
        userId: admin.id,
        subtotal,
        total: subtotal,
        discount: 0,
        tax: 0,
        paymentMethod,
        amountReceived: paymentMethod === 'EFECTIVO' ? subtotal + 10 : subtotal,
        changeAmount: paymentMethod === 'EFECTIVO' ? 10 : 0,
        status: SaleStatus.COMPLETED,
        source: Source.DESKTOP,
        createdAt: saleDate,
        items,
      });
    }
  }

  // Crear ventas
  let created = 0;
  for (const saleData of salesData) {
    try {
      await prisma.sale.create({
        data: {
          userId: saleData.userId,
          subtotal: saleData.subtotal,
          total: saleData.total,
          discount: saleData.discount,
          tax: saleData.tax,
          paymentMethod: saleData.paymentMethod,
          amountReceived: saleData.amountReceived,
          changeAmount: saleData.changeAmount,
          status: saleData.status,
          source: saleData.source,
          createdAt: saleData.createdAt,
          items: {
            createMany: {
              data: saleData.items,
            },
          },
        },
      });
      created++;
    } catch (error) {
      // Error creating sale
    }
  }

  // Mostrar resumen
  const totalSales = await prisma.sale.count({
    where: { status: SaleStatus.COMPLETED }
  });

  const totalRevenue = await prisma.sale.aggregate({
    where: { status: SaleStatus.COMPLETED },
    _sum: { total: true }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    process.exit(1);
  });
