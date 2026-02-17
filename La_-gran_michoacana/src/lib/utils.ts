import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

// ============================================================
// GESTIÓN DE ZONA HORARIA
// ============================================================

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
 * 3. Navegador (detección automática)
 * 4. Default (America/Mexico_City)
 */
export function getConfiguredTimezone(): string {
  if (typeof window === 'undefined') return DEFAULT_TIMEZONE;
  
  // 1. Intentar obtener del usuario autenticado en Railway
  try {
    const authData = localStorage.getItem('auth-storage');
    if (authData) {
      const parsed = JSON.parse(authData);
      const userTimezone = parsed?.state?.user?.timezone;
      if (userTimezone && MEXICO_TIMEZONES.some(tz => tz.value === userTimezone)) {
        return userTimezone;
      }
    }
  } catch (e) {
    console.warn('Error al leer timezone del usuario:', e);
  }
  
  // 2. Intentar obtener de localStorage (configuración manual)
  try {
    const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (stored && MEXICO_TIMEZONES.some(tz => tz.value === stored)) {
      return stored;
    }
  } catch (e) {
    console.warn('Error al leer timezone del localStorage:', e);
  }
  
  // 3. Intentar detectar la zona horaria del navegador
  try {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (MEXICO_TIMEZONES.some(tz => tz.value === browserTimezone)) {
      return browserTimezone;
    }
  } catch (e) {
    console.warn('Error al detectar timezone del navegador:', e);
  }
  
  // 4. Retornar default
  return DEFAULT_TIMEZONE;
}

/**
 * Guarda la zona horaria configurada
 */
export function setConfiguredTimezone(timezone: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    if (!MEXICO_TIMEZONES.some(tz => tz.value === timezone)) {
      throw new Error('Zona horaria no válida');
    }
    localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
  } catch (e) {
    console.error('Error al guardar timezone:', e);
  }
}

/**
 * Obtiene el offset UTC de la zona horaria configurada
 */
export function getTimezoneOffset(): number {
  const timezone = getConfiguredTimezone();
  const tz = MEXICO_TIMEZONES.find(t => t.value === timezone);
  return tz?.offset ?? -6;
}

// ============================================================
// FORMATEO DE FECHAS CON ZONA HORARIA
// ============================================================

/**
 * Convierte una fecha UTC del servidor a hora local configurada y la formatea
 * @param dateString - Fecha en formato ISO string (UTC) desde el servidor
 * @param includeTime - Si incluir la hora en el formato
 * @returns Fecha formateada en la zona horaria configurada
 */
export function formatDate(dateString: string | Date, includeTime: boolean = true): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Verificar que la fecha sea válida
  if (isNaN(date.getTime())) return '';
  
  const timezone = getConfiguredTimezone();
  
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
}

/**
 * Formatea fecha para reportes (más corto)
 */
export function formatDateShort(dateString: string | Date): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '';
  
  const timezone = getConfiguredTimezone();
  
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: timezone,
  }).format(date);
}

/**
 * Formatea solo la hora
 */
export function formatTime(dateString: string | Date): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '';
  
  const timezone = getConfiguredTimezone();
  
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  }).format(date);
}

/**
 * Obtiene la fecha local de la computadora en formato ISO para consultas
 * NOTA: Solo usar para filtros de visualización, NO para guardar en BD
 */
export function getLocalDateForFilter(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

