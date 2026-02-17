/**
 * Wrapper para AsyncStorage compatible con la API de localStorage
 * Permite reutilizar código del desktop con mínimos cambios
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  /**
   * Obtener un item del storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading '${key}' from AsyncStorage:`, error);
      return null;
    }
  },

  /**
   * Guardar un item en el storage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error writing '${key}' to AsyncStorage:`, error);
    }
  },

  /**
   * Eliminar un item del storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing '${key}' from AsyncStorage:`, error);
    }
  },

  /**
   * Limpiar todo el storage
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log('✅ Storage cleared');
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  },
};
