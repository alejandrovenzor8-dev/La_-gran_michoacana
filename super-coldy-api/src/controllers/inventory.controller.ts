/**
 * Controlador de Inventario
 * Maneja las peticiones HTTP del módulo de inventario
 */

import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler.js';

class InventoryController {
  private prisma = new PrismaClient();

  /**
   * GET /api/inventory/summary
   * Obtener resumen del inventario
   * @access Private (CAJERO, GERENTE, ADMIN)
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Obtener todos los productos activos
      const products = await this.prisma.product.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          stock: true,
          minStock: true,
          price: true,
          cost: true,
          category: true,
        },
      });

      // Calcular estadísticas
      const totalProducts = products.length;
      const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
      const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
      const outOfStockProducts = products.filter((p) => p.stock === 0);
      
      // Calcular valor del inventario
      const inventoryValue = products.reduce(
        (sum, p) => sum + p.stock * (p.cost || p.price),
        0
      );

      // Agrupar por categoría
      const byCategory = products.reduce(
        (acc, p) => {
          if (!acc[p.category]) {
            acc[p.category] = {
              count: 0,
              units: 0,
              value: 0,
            };
          }
          acc[p.category].count += 1;
          acc[p.category].units += p.stock;
          acc[p.category].value += p.stock * (p.cost || p.price);
          return acc;
        },
        {} as Record<
          string,
          { count: number; units: number; value: number }
        >
      );

      res.status(200).json({
        success: true,
        data: {
          totalProducts,
          totalUnits,
          inventoryValue: parseFloat(inventoryValue.toFixed(2)),
          lowStockCount: lowStockProducts.length,
          outOfStockCount: outOfStockProducts.length,
          lowStockProducts: lowStockProducts.map((p) => ({
            id: p.id,
            name: p.name,
            stock: p.stock,
            minStock: p.minStock,
          })),
          byCategory: Object.entries(byCategory).map(([category, data]) => ({
            category,
            count: data.count,
            units: data.units,
            value: parseFloat(data.value.toFixed(2)),
          })),
        },
      });
    } catch (error) {
      next(error);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

export const inventoryController = new InventoryController();
