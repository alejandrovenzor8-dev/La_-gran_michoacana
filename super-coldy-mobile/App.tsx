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

  useEffect(() => {
    // Inicializar el store (cargar token desde AsyncStorage)
    const init = async () => {
      await initialize();
      setIsReady(true);
    };
    init();
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
