/**
 * Configuración de la API
 * IMPORTANTE: Reemplaza la URL con tu backend de Railway
 */

export const API_CONFIG = {
  // ⚠️ REEMPLAZA ESTA URL con tu URL de Railway
  baseURL: 'https://la-granmichoacana-production.up.railway.app/api',
  timeout: 10000,
};

// Para desarrollo local (si tu teléfono está en la misma red WiFi):
// Ejemplo: Si tu IP local es 192.168.1.100 y el backend corre en puerto 3000
// export const API_CONFIG = {
//   baseURL: 'http://192.168.1.100:3000/api',
//   timeout: 10000,
// };

/**
 * Cómo obtener tu IP local:
 * - macOS/Linux: ejecuta `ifconfig | grep inet`
 * - Windows: ejecuta `ipconfig` y busca IPv4
 */
