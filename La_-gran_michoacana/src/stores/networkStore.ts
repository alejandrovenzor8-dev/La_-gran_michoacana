import { create } from 'zustand';
import { API_BASE_URL } from '@/lib/apiClient';
import { offlineSalesQueue } from '@/lib/offlineSalesQueue';

export type NetworkHealthStatus = 'online' | 'degraded' | 'offline';

const HEALTHCHECK_URL = API_BASE_URL.replace(/\/api\/?$/, '/health');
const HEALTHCHECK_TIMEOUT_MS = 3000;
const HEALTHCHECK_INTERVAL_MS = 15000;
const DEGRADED_LATENCY_MS = 800;
const OFFLINE_LATENCY_MS = 1800;

let healthcheckIntervalId: number | null = null;
let removeOnlineListener: (() => void) | null = null;
let removeOfflineListener: (() => void) | null = null;

interface NetworkStore {
  healthStatus: NetworkHealthStatus;
  latencyMs: number | null;
  lastCheckedAt: string | null;
  pendingSalesCount: number;
  isMonitoring: boolean;
  isSyncingSales: boolean;
  refreshHealth: () => Promise<NetworkHealthStatus>;
  startMonitoring: () => Promise<() => void>;
  stopMonitoring: () => void;
  refreshPendingSalesCount: () => Promise<number>;
  setSyncingSales: (value: boolean) => void;
  setHealthSnapshot: (status: NetworkHealthStatus, latencyMs: number | null) => void;
}

async function measureHealth(): Promise<{ status: NetworkHealthStatus; latencyMs: number | null }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { status: 'offline', latencyMs: null };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), HEALTHCHECK_TIMEOUT_MS);
  const startedAt = performance.now();

  try {
    const response = await fetch(HEALTHCHECK_URL, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    const latencyMs = Math.round(performance.now() - startedAt);

    if (!response.ok) {
      return { status: 'offline', latencyMs };
    }

    if (latencyMs >= OFFLINE_LATENCY_MS) {
      return { status: 'degraded', latencyMs };
    }

    if (latencyMs >= DEGRADED_LATENCY_MS) {
      return { status: 'degraded', latencyMs };
    }

    return { status: 'online', latencyMs };
  } catch {
    return { status: 'offline', latencyMs: null };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  healthStatus: 'online',
  latencyMs: null,
  lastCheckedAt: null,
  pendingSalesCount: 0,
  isMonitoring: false,
  isSyncingSales: false,

  setHealthSnapshot: (status, latencyMs) => {
    set({
      healthStatus: status,
      latencyMs,
      lastCheckedAt: new Date().toISOString(),
    });
  },

  refreshHealth: async () => {
    const snapshot = await measureHealth();
    get().setHealthSnapshot(snapshot.status, snapshot.latencyMs);
    return snapshot.status;
  },

  refreshPendingSalesCount: async () => {
    const pendingSalesCount = await offlineSalesQueue.countPending();
    set({ pendingSalesCount });
    return pendingSalesCount;
  },

  setSyncingSales: (value) => {
    set({ isSyncingSales: value });
  },

  startMonitoring: async () => {
    if (healthcheckIntervalId !== null) {
      return () => get().stopMonitoring();
    }

    await Promise.all([get().refreshHealth(), get().refreshPendingSalesCount()]);

    const handleOnline = () => {
      void get().refreshHealth();
    };

    const handleOffline = () => {
      get().setHealthSnapshot('offline', null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    removeOnlineListener = () => window.removeEventListener('online', handleOnline);
    removeOfflineListener = () => window.removeEventListener('offline', handleOffline);

    healthcheckIntervalId = window.setInterval(() => {
      void get().refreshHealth();
      void get().refreshPendingSalesCount();
    }, HEALTHCHECK_INTERVAL_MS);

    set({ isMonitoring: true });

    return () => get().stopMonitoring();
  },

  stopMonitoring: () => {
    if (healthcheckIntervalId !== null) {
      window.clearInterval(healthcheckIntervalId);
      healthcheckIntervalId = null;
    }

    removeOnlineListener?.();
    removeOfflineListener?.();
    removeOnlineListener = null;
    removeOfflineListener = null;

    set({ isMonitoring: false });
  },
}));