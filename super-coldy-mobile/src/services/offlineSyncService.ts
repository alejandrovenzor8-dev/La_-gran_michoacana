/**
 * Servicio de sincronización offline
 * Permite guardar datos localmente y sincronizar cuando vuelve la conexión
 */

import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { storage } from '../utils/storage';
import { apiClient } from '../api/client';

export interface OfflineAction {
  id: string;
  type: 'CREATE_SALE' | 'CANCEL_SALE' | 'UPDATE_INVENTORY';
  timestamp: number;
  data: any;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount: number;
}

class OfflineSyncService {
  private isOnline = true;
  private syncInProgress = false;
  private syncIntervalId: NodeJS.Timeout | null = null;

  /**
   * Inicializar monitoreo de conexión
   */
  async initialize() {
    // Verificar estado inicial
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected || false;
    console.log(`📡 Estado inicial de conexión: ${this.isOnline ? 'Online' : 'Offline'}`);

    // Monitorear cambios de conexión
    NetInfo.addEventListener((state) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected || false;

      if (wasOnline !== this.isOnline) {
        if (this.isOnline) {
          console.log('🟢 Conexión restaurada - iniciando sincronización');
          this.syncPendingActions();
        } else {
          console.log('🔴 Conexión perdida - modo offline activado');
        }
      }
    });

    // Sincronizar cada 30 segundos si hay acciones pendientes
    this.syncIntervalId = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingActions();
      }
    }, 30000);
  }

  /**
   * Detener el servicio
   */
  cleanup() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }
  }

  /**
   * Guardar una acción para sincronizar luego
   */
  async saveOfflineAction(type: OfflineAction['type'], data: any): Promise<string> {
    try {
      const actionId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const action: OfflineAction = {
        id: actionId,
        type,
        timestamp: Date.now(),
        data,
        status: 'PENDING',
        retryCount: 0,
      };

      // Obtener acciones existentes
      const existingActions = await this.getPendingActions();
      existingActions.push(action);

      // Guardar en storage
      await storage.setItem('offlineActions', JSON.stringify(existingActions));

      console.log(`💾 Acción guardada offline: ${actionId}`);

      // Si estamos online, intentar sincronizar inmediatamente
      if (this.isOnline) {
        this.syncPendingActions();
      }

      return actionId;
    } catch (error) {
      console.error('Error al guardar acción offline:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las acciones pendientes
   */
  async getPendingActions(): Promise<OfflineAction[]> {
    try {
      const data = await storage.getItem('offlineActions');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Error al obtener acciones offline:', error);
      return [];
    }
  }

  /**
   * Sincronizar todas las acciones pendientes
   */
  async syncPendingActions(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;

    try {
      const actions = await this.getPendingActions();
      const pendingActions = actions.filter((a) => a.status === 'PENDING');

      if (pendingActions.length === 0) {
        console.log('✅ No hay acciones pendientes para sincronizar');
        this.syncInProgress = false;
        return;
      }

      console.log(`🔄 Sincronizando ${pendingActions.length} acciones...`);

      for (const action of pendingActions) {
        try {
          await this.syncAction(action);
        } catch (error) {
          console.error(`❌ Error sincronizando acción ${action.id}:`, error);
          action.retryCount++;

          // Si ya intentamos 3 veces, marcar como fallida
          if (action.retryCount >= 3) {
            action.status = 'FAILED';
            console.warn(`⚠️ Acción ${action.id} marcada como fallida después de 3 intentos`);
          }
        }
      }

      // Guardar estado actualizado
      await storage.setItem('offlineActions', JSON.stringify(actions));
      console.log('✅ Sincronización completada');
    } catch (error) {
      console.error('Error crítico en sincronización:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sincronizar una acción específica
   */
  private async syncAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'CREATE_SALE':
        // TODO: Implementar sincronización de ventas
        console.log('💾 Sincronizando venta:', action.data);
        action.status = 'SYNCED';
        break;

      case 'CANCEL_SALE':
        // TODO: Implementar cancelación de venta
        console.log('🗑️ Sincronizando cancelación de venta:', action.data);
        action.status = 'SYNCED';
        break;

      case 'UPDATE_INVENTORY':
        // TODO: Implementar actualización de inventario
        console.log('📦 Sincronizando inventario:', action.data);
        action.status = 'SYNCED';
        break;
    }
  }

  /**
   * Verificar si estamos online
   */
  isOffline(): boolean {
    return !this.isOnline;
  }

  /**
   * Limpiar acciones sincronizadas
   */
  async clearSyncedActions(): Promise<void> {
    try {
      const actions = await this.getPendingActions();
      const pendingActions = actions.filter((a) => a.status !== 'SYNCED');
      await storage.setItem('offlineActions', JSON.stringify(pendingActions));
      console.log('🧹 Acciones sincronizadas eliminadas');
    } catch (error) {
      console.error('Error al limpiar acciones sincronizadas:', error);
    }
  }
}

export const offlineSyncService = new OfflineSyncService();
