import { offlineSalesQueue } from '@/lib/offlineSalesQueue';
import { saleService } from '@/lib/saleService';
import { useAuthStore } from '@/stores/authStore';
import { useNetworkStore } from '@/stores/networkStore';

const SYNC_INTERVAL_MS = 10000;

let syncIntervalId: number | null = null;
let syncInProgress = false;

function isRetryableSyncError(error: any): boolean {
  const status = Number(error?.status ?? error?.response?.status ?? 0);
  const code = error?.code;
  const message = String(error?.message || '').toLowerCase();

  if (code === 'REQUEST_TIMEOUT') return true;
  if (!status) return true;
  if (status >= 500) return true;
  if (status === 408 || status === 429) return true;
  if (message.includes('network') || message.includes('fetch')) return true;

  return false;
}

async function syncPendingSales() {
  if (syncInProgress) return;

  const { isAuthenticated } = useAuthStore.getState();
  const networkState = useNetworkStore.getState();

  if (!isAuthenticated || networkState.healthStatus === 'offline') {
    return;
  }

  syncInProgress = true;
  useNetworkStore.getState().setSyncingSales(true);

  try {
    const queue = await offlineSalesQueue.list();
    const pendingSales = queue.filter((item) => item.status === 'pending');

    for (const queuedSale of pendingSales) {
      await offlineSalesQueue.update(queuedSale.id, {
        status: 'syncing',
        lastError: null,
      });

      try {
        await saleService.createSale(queuedSale.payload);
        await offlineSalesQueue.remove(queuedSale.id);
      } catch (error: any) {
        const retries = queuedSale.retries + 1;
        const nextStatus = isRetryableSyncError(error) ? 'pending' : 'failed';
        await offlineSalesQueue.update(queuedSale.id, {
          status: nextStatus,
          retries,
          lastError: error?.data?.message || error?.message || 'Error al sincronizar venta',
        });
      }
    }
  } finally {
    syncInProgress = false;
    useNetworkStore.getState().setSyncingSales(false);
    await useNetworkStore.getState().refreshPendingSalesCount();
  }
}

export function startOfflineSalesSync() {
  if (syncIntervalId !== null) {
    return () => stopOfflineSalesSync();
  }

  void syncPendingSales();
  syncIntervalId = window.setInterval(() => {
    void syncPendingSales();
  }, SYNC_INTERVAL_MS);

  return () => stopOfflineSalesSync();
}

export function stopOfflineSalesSync() {
  if (syncIntervalId !== null) {
    window.clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}

export async function triggerOfflineSalesSync() {
  await syncPendingSales();
}