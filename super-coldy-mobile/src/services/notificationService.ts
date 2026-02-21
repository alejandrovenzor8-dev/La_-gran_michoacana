/**
 * Servicio de notificaciones push
 * Se usa para alertar sobre cierre de caja
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { storage } from '../utils/storage';
import { apiClient } from '../api/client';

// Configurar cómo se manejan las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Registrar el dispositivo para recibir push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Verificar si el dispositivo es físico
      if (!Device.isDevice) {
        console.log('⚠️ Las notificaciones push solo funcionan en dispositivos reales');
        return null;
      }

      // Solicitar permisos
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ No se otorgaron permisos para notificaciones');
        return null;
      }

      // Obtener el token de Expo
      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: '7cbf99ef-3c01-4e2c-ad58-6bbf1a1f6a6c', // Cambiar por tu project ID
        })
      ).data;

      console.log('📱 Token de notificación obtido:', token);

      // Guardar el token localmente
      await storage.setItem('expoPushToken', token);
      this.expoPushToken = token;

      // Registrar el token en el backend
      await this.registerTokenWithBackend(token);

      return token;
    } catch (error) {
      console.error('Error al registrar para push notifications:', error);
      return null;
    }
  }

  /**
   * Enviar el token de notificación al backend
   */
  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      await apiClient.post('/notifications/register-device', {
        expoPushToken: token,
        deviceType: Device.osName,
        deviceModel: Device.modelName,
      });
      console.log('✅ Token registrado en el backend');
    } catch (error) {
      console.error('Error al registrar token en backend:', error);
    }
  }

  /**
   * Escuchar notificaciones cuando llegan
   * Llamar esto en el useEffect de la app principal
   */
  setupNotificationListeners() {
    // Cuando una notificación llega mientras la app está enfocada
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📬 Notificación recibida:', notification);
      this.handleNotification(notification);
    });

    // Cuando el usuario toca la notificación
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notificación tocada:', response);
      const data = response.notification.request.content.data;
      if (data.type === 'cashier_cut') {
        // Navegar a la pantalla de cierre de caja
        // Esto se puede hacer pasando un callback desde App.tsx
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }

  /**
   * Manejar notificación basada en su tipo
   */
  private handleNotification(notification: Notifications.Notification) {
    const data = notification.request.content.data;

    switch (data.type) {
      case 'cashier_cut':
        console.log('🔔 Alerta de cierre de caja:', data.message);
        break;
      default:
        console.log('📨 Notificación general:', data.message);
    }
  }

  /**
   * Obtener el token guardado localmente
   */
  async getToken(): Promise<string | null> {
    if (this.expoPushToken) {
      return this.expoPushToken;
    }

    const token = await storage.getItem('expoPushToken');
    if (token) {
      this.expoPushToken = token;
    }

    return token || null;
  }

  /**
   * Limpiar el token cuando el usuario logout
   */
  async clearToken(): Promise<void> {
    try {
      await storage.removeItem('expoPushToken');
      this.expoPushToken = null;

      // Notificar al backend que el dispositivo se desregistró
      await apiClient.post('/notifications/unregister-device', {});
    } catch (error) {
      console.error('Error al limpiar token de notificaciones:', error);
    }
  }
}

export const notificationService = new NotificationService();
