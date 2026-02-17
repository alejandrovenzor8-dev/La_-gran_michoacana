import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      total: true,
    },
    take: 10
  });

  const stats = await prisma.sale.aggregate({
    _count: true,
    _min: { createdAt: true },
    _max: { createdAt: true }
  });

  // Contar ventas futuras
  const futureSales = await prisma.sale.count({
    where: {
      createdAt: {
        gt: today
      }
    }
  });
}

main()
  .catch(() => {})
  .finally(() => prisma.$disconnect());
