/**
 * Entry point de la aplicación
 * Configura providers y navegación
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/stores/authStore';
import { notificationService } from './src/services/notificationService';
import { offlineSyncService } from './src/services/offlineSyncService';

// Tema personalizado
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563eb', // Azul
    secondary: '#10b981', // Verde
    error: '#ef4444', // Rojo
    background: '#f9fafb',
    surface: '#ffffff',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: '#1f2937',
    onSurface: '#1f2937',
  },
};

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const initialize = useAuthStore((state) => state.initialize);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Inicializar el store (cargar token desde AsyncStorage)
    const init = async () => {
      await initialize();
      
      // Inicializar servicios de sync offline y notificaciones
      await offlineSyncService.initialize();
      
      // Registrar para notificaciones push si el usuario está autenticado
      if (user) {
        await notificationService.registerForPushNotifications();
        notificationService.setupNotificationListeners();
      }
      
      setIsReady(true);
    };
    init();

    // Cleanup
    return () => {
      offlineSyncService.cleanup();
    };
  }, []);

  if (!isReady) {
    // Puedes agregar un SplashScreen aquí
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
