/**
 * Utilidades para formatear fechas con soporte a zonas horarias
 * Las fechas del backend vienen en UTC, pero se muestran en la zona horaria del usuario
 */

import { useAuthStore } from '../stores/authStore';
import { storage } from './storage';

const TIMEZONE_STORAGE_KEY = 'app_timezone';
const DEFAULT_TIMEZONE = 'America/Mexico_City'; // UTC-6

/**
 * Zonas horarias disponibles en México
 */
export const MEXICO_TIMEZONES = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (UTC-6/-5)', offset: -6 },
  { value: 'America/Cancun', label: 'Cancún/Quintana Roo (UTC-5)', offset: -5 },
  { value: 'America/Monterrey', label: 'Monterrey (UTC-6/-5)', offset: -6 },
  { value: 'America/Mazatlan', label: 'Mazatlán/Sinaloa (UTC-7/-6)', offset: -7 },
  { value: 'America/Chihuahua', label: 'Chihuahua (UTC-7/-6)', offset: -7 },
  { value: 'America/Hermosillo', label: 'Hermosillo/Sonora (UTC-7 sin horario de verano)', offset: -7 },
  { value: 'America/Tijuana', label: 'Tijuana/Baja California (UTC-8/-7)', offset: -8 },
] as const;

/**
 * Obtiene la zona horaria configurada desde:
 * 1. Usuario autenticado (BD de Railway)
 * 2. localStorage (configuración manual)
 * 3. Default (America/Mexico_City)
 */
export async function getConfiguredTimezone(): Promise<string> {
  try {
    // 1. Intentar obtener del usuario autenticado
    const user = useAuthStore.getState().user;
    if (user?.timezone && MEXICO_TIMEZONES.some(tz => tz.value === user.timezone)) {
      return user.timezone;
    }
  } catch (e) {
    console.warn('Error al leer timezone del usuario:', e);
  }

  try {
    // 2. Intentar obtener de AsyncStorage (configuración manual)
    const stored = await storage.getItem(TIMEZONE_STORAGE_KEY);
    if (stored && MEXICO_TIMEZONES.some(tz => tz.value === stored)) {
      return stored;
    }
  } catch (e) {
    console.warn('Error al leer timezone del AsyncStorage:', e);
  }

  // 3. Retornar default
  return DEFAULT_TIMEZONE;
}

/**
 * Guarda la zona horaria configurada
 */
export async function setConfiguredTimezone(timezone: string): Promise<void> {
  try {
    if (!MEXICO_TIMEZONES.some(tz => tz.value === timezone)) {
      throw new Error('Zona horaria no válida');
    }
    await storage.setItem(TIMEZONE_STORAGE_KEY, timezone);
  } catch (e) {
    console.error('Error al guardar timezone:', e);
  }
}

/**
 * Obtiene el offset UTC de la zona horaria configurada
 */
export async function getTimezoneOffset(): Promise<number> {
  const timezone = await getConfiguredTimezone();
  const tz = MEXICO_TIMEZONES.find(t => t.value === timezone);
  return tz?.offset ?? -6;
}

/**
 * Convierte una fecha UTC del servidor a hora local configurada y la formatea
 * @param dateString - Fecha en formato ISO string (UTC) desde el servidor o Date object
 * @param includeTime - Si incluir la hora en el formato
 * @returns Fecha formateada en la zona horaria configurada
 */
export async function formatDate(
  dateString: string | Date,
  includeTime: boolean = true
): Promise<string> {
  if (!dateString) return '';

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    // Verificar que la fecha sea válida
    if (isNaN(date.getTime())) return '';

    const timezone = await getConfiguredTimezone();

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: timezone,
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
    };

    return new Intl.DateTimeFormat('es-MX', options).format(date);
  } catch (e) {
    console.error('Error al formatear fecha:', e);
    return dateString instanceof Date ? dateString.toISOString() : dateString;
  }
}

/**
 * Formatea fecha para ocasiones donde solo se necesita la fecha sin hora
 */
export async function formatDateShort(dateString: string | Date): Promise<string> {
  if (!dateString) return '';

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) return '';

    const timezone = await getConfiguredTimezone();

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone,
    };

    return new Intl.DateTimeFormat('es-MX', options).format(date);
  } catch (e) {
    console.error('Error al formatear fecha corta:', e);
    return dateString instanceof Date ? dateString.toISOString() : dateString;
  }
}

/**
 * Formatea fecha para mostrar solo la hora
 */
export async function formatTime(dateString: string | Date): Promise<string> {
  if (!dateString) return '';

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) return '';

    const timezone = await getConfiguredTimezone();

    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: timezone,
      hour12: false,
    };

    return new Intl.DateTimeFormat('es-MX', options).format(date);
  } catch (e) {
    console.error('Error al formatear hora:', e);
    return dateString instanceof Date ? dateString.toISOString() : dateString;
  }
}
