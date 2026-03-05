import { PrismaClient, AuditAction } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditLogData {
  userId?: number;
  branchId?: number;
  action: AuditAction;
  entity: string;
  entityId?: number;
  description: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Registra una acción en el sistema de auditoría
 * @param data Datos del log de auditoría
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        branchId: data.branchId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        description: data.description,
        oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
        newValues: data.newValues ? JSON.stringify(data.newValues) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error('Error al crear log de auditoría:', error);
    // No lanzamos el error para no interrumpir el flujo principal
  }
}

/**
 * Obtiene los logs de auditoría con filtros opcionales
 */
export async function getAuditLogs(filters?: {
  userId?: number;
  branchId?: number;
  entity?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (filters?.userId) where.userId = filters.userId;
  if (filters?.branchId) where.branchId = filters.branchId;
  if (filters?.entity) where.entity = filters.entity;
  if (filters?.action) where.action = filters.action;

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs: logs.map((log) => ({
      ...log,
      oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
      newValues: log.newValues ? JSON.parse(log.newValues) : null,
    })),
    total,
  };
}

/**
 * Middleware para extraer información de la petición HTTP
 */
export function getRequestInfo(req: any) {
  return {
    ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('user-agent') || 'unknown',
  };
}

export { AuditAction };
