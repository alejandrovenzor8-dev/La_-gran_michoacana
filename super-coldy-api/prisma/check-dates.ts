import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  console.log('📅 Fecha actual del sistema:', today.toISOString());
  console.log('📅 Fecha formato local:', today.toLocaleDateString('es-MX'));
  
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      total: true,
    },
    take: 10
  });

  console.log('\n📊 Últimas 10 ventas:');
  sales.forEach((sale, idx) => {
    const saleDate = new Date(sale.createdAt);
    const isFuture = saleDate > today;
    console.log(`${idx + 1}. ID: ${sale.id} | Fecha: ${saleDate.toLocaleDateString('es-MX')} | Total: $${sale.total} ${isFuture ? '⚠️ FUTURA' : '✅'}`);
  });

  const stats = await prisma.sale.aggregate({
    _count: true,
    _min: { createdAt: true },
    _max: { createdAt: true }
  });

  console.log('\n📈 Estadísticas:');
  console.log('Total de ventas:', stats._count);
  console.log('Primera venta:', stats._min.createdAt ? new Date(stats._min.createdAt).toLocaleDateString('es-MX') : 'N/A');
  console.log('Última venta:', stats._max.createdAt ? new Date(stats._max.createdAt).toLocaleDateString('es-MX') : 'N/A');
  
  // Contar ventas futuras
  const futureSales = await prisma.sale.count({
    where: {
      createdAt: {
        gt: today
      }
    }
  });
  
  console.log('\n⚠️ Ventas con fecha futura:', futureSales);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
