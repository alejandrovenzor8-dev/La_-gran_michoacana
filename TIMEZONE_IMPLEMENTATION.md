# Gestión de Zonas Horarias en La Gran Michoacana

## Problema Resuelto
Las ventas se guardan en **UTC en el backend** (correcto para evitar fraudes), pero ahora se muestran en la **zona horaria local configurada** en el frontend y app móvil.

## Arquitectura

### Backend (super-coldy-api)
- ✅ Las fechas se guardan en **UTC** en la base de datos
- ✅ Campo `timezone` en el modelo `User` para almacenar la preferencia del usuario
- ✅ Endpoints `/settings/timezone` y `/users/{id}` para actualizar la zona horaria

### Frontend (La_-gran_michoacana)

#### Funciones de Utilidad en `src/lib/utils.ts`
```typescript
// Obtener zona horaria configurada (prioridad: usuario autenticado → localStorage → detección automática → default)
getConfiguredTimezone(): string

// Guardar zona horaria
setConfiguredTimezone(timezone: string): void

// Convertir fecha UTC a zona horaria local y formatear
formatDate(dateString: string | Date, includeTime: boolean = true): string

// Solo fecha sin hora
formatDateShort(dateString: string | Date): string

// Offset UTC
getTimezoneOffset(): number
```

#### Componentes Actualizados
1. **ReportsPage.tsx** - Muestra reportes de ventas con fechas en zona horaria configurada
2. **CustomerDisplayPage.tsx** - Muestra fecha y hora actual en zona horaria del usuario
3. **PaymentDialog.tsx** - Registra fecha del ticket en zona horaria configurada
4. **UsersPage.tsx** - Ya usa `formatDate()` correctamente

### App Móvil (super-coldy-mobile)

#### Nuevo Archivo `src/utils/dateFormatter.ts`
Proporciona funciones análogas al frontend:
```typescript
// Funciones asincrónicas (React Native con AsyncStorage)
getConfiguredTimezone(): Promise<string>
setConfiguredTimezone(timezone: string): Promise<void>
formatDate(dateString: string | Date, includeTime: boolean): Promise<string>
formatDateShort(dateString: string | Date): Promise<string>
formatTime(dateString: string | Date): Promise<string>
```

#### Componentes Actualizados
1. **UsersManagementScreen.tsx** - `parseDate()` ahora respeta la zona horaria del usuario
2. **DashboardScreen.tsx** - Muestra fechas en zona horaria configurada

## Zonas Horarias Disponibles

```typescript
const MEXICO_TIMEZONES = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (UTC-6/-5)', offset: -6 },
  { value: 'America/Cancun', label: 'Cancún/Quintana Roo (UTC-5)', offset: -5 },
  { value: 'America/Monterrey', label: 'Monterrey (UTC-6/-5)', offset: -6 },
  { value: 'America/Mazatlan', label: 'Mazatlán/Sinaloa (UTC-7/-6)', offset: -7 },
  { value: 'America/Chihuahua', label: 'Chihuahua (UTC-7/-6)', offset: -7 },
  { value: 'America/Hermosillo', label: 'Hermosillo/Sonora (UTC-7)', offset: -7 },
  { value: 'America/Tijuana', label: 'Tijuana/Baja California (UTC-8/-7)', offset: -8 },
];
```

## Flujo de Funcionamiento

### 1. Seleccionar Zona Horaria (SettingsPage)
```
Usuario selecciona zona horaria
    ↓
Se guarda en localStorage (acceso rápido)
    ↓
Si está autenticado (ADMIN):
  → Se actualiza globalmente en Railway (/settings/timezone)
  → Se aplica a todos los usuarios del sistema
    ↓
Si no es ADMIN:
  → Se actualiza a nivel individual (/users/{id})
  → Se aplica solo al usuario actual
```

### 2. Mostrar Datos (Lectura)
```
Backend devuelve fecha en UTC
    ↓
Frontend/App obtiene zona horaria configurada:
  1. Del usuario autenticado (BD)
  2. De localStorage (configuración manual)
  3. Detección automática del navegador
  4. Por defecto: America/Mexico_City
    ↓
Usa Intl.DateTimeFormat para convertir UTC → Zona Horaria Local
    ↓
Muestra al usuario en su zona horaria sin modificar la BD
```

## Ejemplos de Uso

### Frontend
```typescript
import { formatDate, formatDateShort } from '@/lib/utils';

// Con hora
<span>{formatDate(new Date())}</span>  // "18/02/2026 14:30:45"

// Solo fecha
<span>{formatDateShort(new Date())}</span>  // "18 de febrero de 2026"

// Fechas del servidor (UTC)
<span>{formatDate(sale.createdAt)}</span>  // Se convierte automáticamente
```

### App Móvil
```typescript
import { formatDate, MEXICO_TIMEZONES } from '../../utils/dateFormatter';

// Uso en componentes
const formattedDate = await formatDate(new Date());

// O con timezone del usuario (síncrono)
const user = useAuthStore.getState().user;
const timezone = user?.timezone || 'America/Mexico_City';
const date = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'full',
  timeZone: timezone,
}).format(new Date());
```

## Seguridad

✅ **Integridad de datos asegurada:**
- Las fechas se mantienen en UTC en la base de datos
- No hay riesgo de fraude temporal
- La conversión es solo de visualización (lectura)

✅ **Auditoría:**
- Las fechas reales (UTC) están preservadas en Railway
- Las conversiones de zona horaria son solo del lado del cliente
- Los reportes pueden ser recalculados en cualquier zona horaria

## Próximos Pasos (Opcional)

1. Agregar selector de zona horaria en la app móvil
2. Sincronizar timezone de usuario entre dispositivos
3. Agregar opción para mostrar ambas zonas horarias (UTC + Local)
4. Exportar datos con timestamp de zona horaria

