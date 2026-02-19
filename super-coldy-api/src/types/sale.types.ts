/**
 * Tipos e interfaces para el módulo de Ventas
 * Define la estructura de datos para operaciones de punto de venta
 */

import type { PaymentMethod, SaleStatus, Source } from '@prisma/client';

/**
 * Interface para items de venta en el request
 * Representa un producto dentro de una venta
 */
export interface SaleItemInput {
  /** ID del producto */
  productId: string;

  /** Nombre del producto al momento de la venta */
  productName: string;

  /** Cantidad vendida */
  quantity: number;

  /** Precio unitario al momento de la venta */
  unitPrice: number;

  /** Subtotal del item (quantity * unitPrice) */
  subtotal: number;

  /** Descuento aplicado al item (opcional) */
  discount?: number;
}

/**
 * Interface para la respuesta de item de venta
 * Incluye todos los campos del item incluyendo el ID
 */
export interface SaleItem extends SaleItemInput {
  /** ID único del item de venta */
  id: string;

  /** ID de la venta a la que pertenece */
  saleId: string;

  /** Fecha de creación del item */
  createdAt: Date;

  /** Fecha de última actualización */
  updatedAt: Date;
}

/**
 * Interface para crear una venta
 * Agrega al request información de pago y metadatos
 */
export interface CreateSaleInput {
  /** Array de items vendidos */
  items: SaleItemInput[];

  /** Método de pago: efectivo, tarjeta o mixto */
  paymentMethod: PaymentMethod | 'EFECTIVO' | 'TARJETA' | 'MIXTO';

  /** Monto recibido (requerido para EFECTIVO, opcional para otros) */
  amountReceived?: number;

  /** Monto de cambio (se calcula automáticamente) */
  changeAmount?: number;

  /** Descuento total aplicado a la venta */
  discount?: number;

  /** Impuesto/IVA aplicado */
  tax?: number;

  /** Notas adicionales sobre la venta */
  notes?: string;

  /** Origen de la transacción (web, mobile, etc) */
  source?: Source | 'DESKTOP' | 'MOBILE';
}

/**
 * Interface para la respuesta de venta completa
 * Incluye información del usuario, items y detalles de pago
 */
export interface SaleResponse {
  /** ID único de la venta */
  id: string;

  /** ID del usuario que realizó la venta */
  userId: string;

  /** Información del usuario */
  user: {
    id: string;
    username: string;
    fullName?: string | null;
  };

  /** Items vendidos en la transacción */
  items: SaleItem[];

  /** Monto total de la venta (después de descuentos e impuestos) */
  total: number;

  /** Subtotal antes de descuentos e impuestos */
  subtotal: number;

  /** Monto total de descuentos aplicados */
  discount: number;

  /** Monto de impuestos/IVA */
  tax: number;

  /** Método de pago utilizado */
  paymentMethod: PaymentMethod | string;

  /** Monto recibido en pago */
  amountReceived?: number;

  /** Monto de cambio devuelto */
  changeAmount?: number;

  /** Estado de la venta (completada, cancelada, reembolsada) */
  status: SaleStatus | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';

  /** Notas adicionales de la venta */
  notes?: string | null;

  /** Origen de la transacción */
  source: Source | 'DESKTOP' | 'MOBILE';

  /** Fecha y hora de creación */
  createdAt: Date;

  /** Fecha y hora de última actualización */
  updatedAt: Date;
}

/**
 * Interface para filtros de consulta de ventas
 * Permite buscar y filtrar ventas por diferentes criterios
 */
export interface SaleFilters {
  /** Fecha inicial del rango (incluida) */
  startDate?: Date;

  /** Fecha final del rango (incluida) */
  endDate?: Date;

  /** ID del usuario que realizó la venta */
  userId?: string;

  /** Filtrar por sucursal */
  branchId?: number;

  /** Filtrar por método de pago */
  paymentMethod?: PaymentMethod | 'EFECTIVO' | 'TARJETA' | 'MIXTO';

  /** Filtrar por estado de la venta */
  status?: SaleStatus | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';

  /** Filtrar por origen de la transacción */
  source?: Source | 'DESKTOP' | 'MOBILE';

  /** Número de página para paginación (default: 1) */
  page?: number;

  /** Cantidad de registros por página (default: 50) */
  limit?: number;
}

/**
 * Interface para respuesta paginada de ventas
 * Incluye los datos y metadatos de paginación
 */
export interface SaleListResponse {
  /** Array de ventas */
  sales: SaleResponse[];

  /** Total de registros encontrados */
  total: number;

  /** Página actual */
  page: number;

  /** Cantidad de registros por página */
  limit: number;

  /** Total de páginas */
  totalPages: number;
}

/**
 * Interface para estadísticas diarias de ventas
 * Resumen de métricas clave del día
 */
export interface DailySalesStats {
  /** Cantidad total de ventas en el período */
  totalSales: number;

  /** Ingresos totales (suma de totales de venta) */
  totalRevenue: number;

  /** Ticket promedio (totalRevenue / totalSales) */
  averageTicket: number;

  /** Cantidad de ventas en efectivo */
  effectivoSales: number;

  /** Cantidad de ventas con tarjeta */
  tarjetaSales: number;

  /** Cantidad de ventas mixtas */
  mixtoSales: number;

  /** Los 5 productos más vendidos */
  topProducts: Array<{
    /** ID del producto */
    productId: string;

    /** Nombre del producto */
    productName: string;

    /** Cantidad vendida */
    quantity: number;

    /** Ingresos generados por este producto */
    revenue: number;
  }>;

  /** Ingresos en efectivo */
  efectivoRevenue?: number;

  /** Ingresos con tarjeta */
  tarjetaRevenue?: number;

  /** Ingresos mixtos */
  mixtoRevenue?: number;

  /** Total de descuentos aplicados */
  totalDiscount?: number;

  /** Total de impuestos cobrados */
  totalTax?: number;
}

/**
 * Interface para estadísticas de período (semanal, mensual, etc)
 * Extensión de DailySalesStats con datos acumulados
 */
export interface PeriodSalesStats extends DailySalesStats {
  /** Período cubierto (ej: "2026-02-01 to 2026-02-28") */
  period: string;

  /** Fecha de inicio del período */
  startDate: Date;

  /** Fecha de fin del período */
  endDate: Date;

  /** Número de días con ventas */
  activeDays: number;

  /** Mejor día (fecha y monto) */
  bestDay?: {
    date: Date;
    revenue: number;
  };

  /** Peor día (fecha y monto) */
  worstDay?: {
    date: Date;
    revenue: number;
  };
}

/**
 * Interface para refundos de venta
 * Maneja devoluções y reembolsos parciales
 */
export interface SaleRefundInput {
  /** ID de la venta a reembolsar */
  saleId: string;

  /** Items a reembolsar (opcional, si no se especifica se reembolsa todo) */
  itemIds?: string[];

  /** Razón del reembolso */
  reason: string;

  /** Notas adicionales */
  notes?: string;
}

/**
 * Interface para respuesta de refund
 * Resultado de un reembolso procesado
 */
export interface RefundResponse {
  /** ID único del reembolso */
  id: string;

  /** ID de la venta reembolsada */
  saleId: string;

  /** Información de la venta original */
  sale: SaleResponse;

  /** Monto reembolsado */
  amount: number;

  /** Razón del reembolso */
  reason: string;

  /** Notas del reembolso */
  notes?: string;

  /** Usuario que procesó el reembolso */
  processedBy: {
    id: string;
    username: string;
  };

  /** Estado del reembolso */
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  /** Fecha de creación */
  createdAt: Date;

  /** Fecha de aprobación/rechazo */
  processedAt?: Date;
}

/**
 * Interface para validación de venta
 * Resultado de validar una venta antes de procesarla
 */
export interface SaleValidationResult {
  /** Indica si la venta es válida */
  isValid: boolean;

  /** Errores encontrados (si los hay) */
  errors: Array<{
    /** Campo con error */
    field: string;

    /** Mensaje de error */
    message: string;
  }>;

  /** Advertencias (no bloquean el proceso) */
  warnings: Array<{
    /** Campo con advertencia */
    field: string;

    /** Mensaje de advertencia */
    message: string;
  }>;

  /** Monto total calculado */
  totalAmount?: number;

  /** Cambio a devolver */
  change?: number;
}
