import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import prisma from '../config/database.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = Router();

/**
 * PUT /api/settings/timezone
 * Actualiza la zona horaria para TODOS los usuarios del sistema
 * Solo accesible por administradores
 */
router.put(
  '/timezone',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      // Verificar que el usuario es admin
      if (req.user?.role !== 'ADMIN') {
        throw new AppError('Solo los administradores pueden cambiar la configuración global', 403);
      }

      const { timezone } = req.body;

      if (!timezone) {
        throw new AppError('La zona horaria es requerida', 400);
      }

      logger.info('Actualizando zona horaria global', { 
        adminId: req.user?.userId, 
        timezone 
      });

      // Actualizar TODOS los usuarios con la nueva zona horaria
      const result = await prisma.user.updateMany({
        data: {
          timezone,
        },
      });

      logger.info('Zona horaria actualizada para todos los usuarios', { 
        usersUpdated: result.count,
        timezone 
      });

      res.status(200).json({
        status: 'success',
        message: `Zona horaria actualizada para ${result.count} usuarios`,
        data: { 
          timezone,
          usersUpdated: result.count 
        },
      });
    } catch (error) {
      logger.error('Error actualizando zona horaria global:', error);
      throw error;
    }
  })
);

/**
 * PUT /api/settings/printer/:branchId
 * Guarda la impresora por defecto para una sucursal
 * No requiere autenticación (acceso público para Electron)
 */
router.put(
  '/printer/:branchId',
  asyncHandler(async (req, res) => {
    const { branchId } = req.params;
    const { printerName } = req.body;

    if (!branchId || isNaN(Number(branchId))) {
      throw new AppError('ID de sucursal inválido', 400);
    }

    if (!printerName || typeof printerName !== 'string') {
      throw new AppError('Nombre de impresora es requerido', 400);
    }

    logger.info('Guardando impresora para sucursal', { 
      branchId: Number(branchId),
      printerName 
    });

    // Verificar que la sucursal existe
    const branch = await prisma.branch.findUnique({
      where: { id: Number(branchId) },
    });

    if (!branch) {
      throw new AppError('Sucursal no encontrada', 404);
    }

    // Actualizar la impresora de la sucursal
    const updatedBranch = await prisma.branch.update({
      where: { id: Number(branchId) },
      data: { defaultPrinter: printerName },
    });

    logger.info('Impresora guardada exitosamente', { 
      branchId: Number(branchId),
      printerName 
    });

    res.status(200).json({
      status: 'success',
      message: 'Impresora guardada exitosamente',
      data: {
        branchId: updatedBranch.id,
        printerName: updatedBranch.defaultPrinter,
      },
    });
  })
);

/**
 * GET /api/settings/printer/:branchId
 * Obtiene la impresora por defecto para una sucursal
 * No requiere autenticación (acceso público para Electron)
 */
router.get(
  '/printer/:branchId',
  asyncHandler(async (req, res) => {
    const { branchId } = req.params;

    if (!branchId || isNaN(Number(branchId))) {
      throw new AppError('ID de sucursal inválido', 400);
    }

    logger.info('Obteniendo impresora para sucursal', { 
      branchId: Number(branchId)
    });

    // Obtener la sucursal y su impresora
    const branch = await prisma.branch.findUnique({
      where: { id: Number(branchId) },
      select: { id: true, defaultPrinter: true },
    });

    if (!branch) {
      throw new AppError('Sucursal no encontrada', 404);
    }

    logger.info('Impresora obtenida exitosamente', { 
      branchId: Number(branchId),
      printerName: branch.defaultPrinter
    });

    res.status(200).json({
      status: 'success',
      data: {
        branchId: branch.id,
        printerName: branch.defaultPrinter || null,
      },
    });
  })
);

export default router;
