import type { Sale } from './saleService';

export type QueuedSaleStatus = 'pending' | 'syncing' | 'failed';

export interface QueuedSaleRecord {
  id: string;
  localSaleId: string;
  payload: Sale;
  status: QueuedSaleStatus;
  retries: number;
  total: number;
  branchId?: number;
  createdAt: string;
  updatedAt: string;
  lastError?: string | null;
}

const FALLBACK_STORAGE_KEY = 'offline-sales-queue';

function calculateSaleTotal(sale: Sale): number {
  const itemsSubtotal = (sale.items || []).reduce((sum, item) => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
    const subtotal = Number(item.subtotal ?? quantity * unitPrice);
    return sum + subtotal;
  }, 0);

  return Number(sale.total ?? (itemsSubtotal - Number(sale.discount ?? 0) + Number(sale.tax ?? 0)));
}

function buildQueuedRecord(sale: Sale): QueuedSaleRecord {
  const timestamp = Date.now();
  const isoNow = new Date(timestamp).toISOString();
  const localSaleId = `LOCAL-${timestamp.toString(36).toUpperCase()}`;

  return {
    id: crypto.randomUUID(),
    localSaleId,
    payload: sale,
    status: 'pending',
    retries: 0,
    total: calculateSaleTotal(sale),
    branchId: sale.branchId,
    createdAt: isoNow,
    updatedAt: isoNow,
    lastError: null,
  };
}

function readFallbackQueue(): QueuedSaleRecord[] {
  const rawQueue = localStorage.getItem(FALLBACK_STORAGE_KEY);
  if (!rawQueue) return [];

  try {
    const parsed = JSON.parse(rawQueue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFallbackQueue(queue: QueuedSaleRecord[]) {
  localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(queue));
}

class OfflineSalesQueueService {
  async list(): Promise<QueuedSaleRecord[]> {
    if (window.electronAPI?.getPendingSalesQueue) {
      return await window.electronAPI.getPendingSalesQueue();
    }

    return readFallbackQueue();
  }

  async enqueue(sale: Sale): Promise<QueuedSaleRecord> {
    const record = buildQueuedRecord(sale);

    if (window.electronAPI?.enqueuePendingSale) {
      const response = await window.electronAPI.enqueuePendingSale(record);
      if (!response.success || !response.item) {
        throw new Error(response.error || 'No se pudo guardar la venta localmente');
      }
      return response.item;
    }

    const queue = readFallbackQueue();
    queue.push(record);
    writeFallbackQueue(queue);
    return record;
  }

  async update(id: string, updates: Partial<QueuedSaleRecord>): Promise<QueuedSaleRecord | null> {
    if (window.electronAPI?.updatePendingSale) {
      const response = await window.electronAPI.updatePendingSale(id, updates);
      return response.success ? (response.item ?? null) : null;
    }

    const queue = readFallbackQueue();
    const index = queue.findIndex((item) => item.id === id);
    if (index === -1) return null;

    queue[index] = {
      ...queue[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeFallbackQueue(queue);
    return queue[index];
  }

  async remove(id: string): Promise<boolean> {
    if (window.electronAPI?.removePendingSale) {
      const response = await window.electronAPI.removePendingSale(id);
      return Boolean(response.success && response.removed);
    }

    const queue = readFallbackQueue();
    const nextQueue = queue.filter((item) => item.id !== id);
    writeFallbackQueue(nextQueue);
    return nextQueue.length !== queue.length;
  }

  async countPending(): Promise<number> {
    const queue = await this.list();
    return queue.filter((item) => item.status === 'pending' || item.status === 'syncing').length;
  }
}

export const offlineSalesQueue = new OfflineSalesQueueService();