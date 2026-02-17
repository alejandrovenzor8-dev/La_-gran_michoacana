# 🔒 Seguridad: Manejo de Fechas y Timestamps

## ⚠️ Problema de Seguridad Identificado

### Vulnerabilidad: Uso de hora local del cliente
Si guardamos las fechas usando `new Date()` del cliente (computadora), un empleado malicioso podría:

1. **Cambiar la hora de la computadora** antes de hacer una venta
2. **Registrar ventas en fechas pasadas o futuras**
3. **Alterar reportes de ventas diarias/mensuales**
4. **Ocultar ventas** registrándolas en fechas incorrectas
5. **Manipular estadísticas** del negocio

### Ejemplo de Estafa
```
1. Empleado cambia la hora de la PC a 3 días atrás
2. Hace una venta de $5,000
3. La venta se registra con fecha de hace 3 días
4. Los reportes diarios no coinciden
5. El dinero "desaparece" de los registros actuales
```

---

## ✅ Solución Implementada: UTC en Servidor

### Principio de Seguridad
**NUNCA confiar en el cliente para datos críticos**

### Cómo Funciona

#### 1. **Base de Datos (PostgreSQL)**
- Guarda TODAS las fechas en UTC (Tiempo Universal Coordinado)
- El campo `createdAt` usa `@default(now())` en Prisma
- PostgreSQL obtiene la hora de su propio servidor
- ⛔ **NO se puede manipular desde el cliente**

```prisma
model Sale {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())  // Hora del servidor PG
  // ...
}
```

#### 2. **API (Node.js/Express)**
- NO captura la hora del cliente
- Deja que PostgreSQL asigne `createdAt` automáticamente
- La hora viene del servidor donde corre PostgreSQL

```typescript
// ✅ CORRECTO - Prisma asigna la fecha del servidor
await prisma.sale.create({
  data: {
    userId,
    total,
    // createdAt se asigna automáticamente
  },
});

// ❌ INCORRECTO - Vulnerable a manipulación
await prisma.sale.create({
  data: {
    userId,
    total,
    createdAt: new Date(), // Hora del servidor Node (puede ser manipulada)
  },
});
```

#### 3. **Frontend (React)**
- Recibe fechas en UTC desde la API
- **Convierte a hora local SOLO para visualización**
- NO envía fechas al crear ventas

```typescript
// ✅ Funciones de utilidad creadas
import { formatDate, formatTime, formatDateShort } from '@/lib/utils';

// Convierte UTC a hora local para mostrar al usuario
formatDate(sale.createdAt); // "16/02/2026, 14:30:45"
formatTime(sale.createdAt); // "2:30 PM"
```

---

## ⚙️ Configuración de Zona Horaria

### Nueva Funcionalidad
El sistema ahora permite **configurar la zona horaria** para visualización sin comprometer la seguridad.

#### Zonas Horarias Disponibles (México)
1. **Ciudad de México** - UTC-6 (UTC-5 en horario de verano)
2. **Cancún/Quintana Roo** - UTC-5
3. **Monterrey** - UTC-6 (UTC-5 en horario de verano)
4. **Mazatlán/Sinaloa** - UTC-7 (UTC-6 en horario de verano)
5. **Chihuahua** - UTC-7 (UTC-6 en horario de verano)
6. **Hermosillo/Sonora** - UTC-7 (sin horario de verano)
7. **Tijuana/Baja California** - UTC-8 (UTC-7 en horario de verano)

#### Cómo Configurar
1. Ve a **Configuración** en el menú lateral
2. En la sección "Zona Horaria", selecciona tu ubicación
3. La vista previa muestra la hora actual en tu zona
4. El cambio se aplica inmediatamente en toda la aplicación
5. **La configuración se guarda en Railway** - persiste en todos los dispositivos

#### Ejemplo de Uso
```typescript
// En utils.ts
import { getConfiguredTimezone, setConfiguredTimezone, MEXICO_TIMEZONES } from '@/lib/utils';

// Obtener la zona horaria actual (con fallback de 4 niveles)
const timezone = getConfiguredTimezone(); // 'America/Mexico_City'

// Cambiar la zona horaria (se guarda en Railway, localStorage y authStore)
setConfiguredTimezone('America/Cancun');

// Las funciones de formateo usan automáticamente la zona configurada
formatDate(sale.createdAt); // Se ajusta a la zona seleccionada
```

#### Sistema de Persistencia Multi-Nivel
El timezone se sincroniza en 3 lugares para máxima confiabilidad:

1. **Base de Datos Railway** (Prioridad 1)
   - Campo `timezone` en la tabla `User`
   - Persiste entre dispositivos y sesiones
   - Valor por defecto: `'America/Mexico_City'`

2. **localStorage del navegador** (Prioridad 2)
   - Clave: `'super-coldy-timezone'`
   - Fallback si no hay conexión a Railway
   - Se sincroniza al guardar en Settings

3. **authStore de Zustand** (Prioridad 3)
   - Estado global de la aplicación
   - Se actualiza al login y al cambiar timezone
   - Facilita acceso rápido en toda la app

4. **Detección del navegador** (Prioridad 4)
   - Fallback final: `Intl.DateTimeFormat().resolvedOptions().timeZone`
   - Si todo falla, usa zona del sistema operativo

#### Seguridad
- ✅ **La configuración es solo visual** - no afecta los datos en la BD
- ✅ **Las ventas siguen guardándose en UTC** en el servidor
- ✅ **No se puede manipular** para alterar registros
- ✅ **Se guarda en Railway** - persiste entre dispositivos y navegadores
- ✅ **Requiere autenticación** - solo usuarios logueados pueden configurar

---

## 📋 Implementación

### Archivos Modificados

1. **`super-coldy-api/prisma/schema.prisma`**
   - Agregado campo `timezone String @default("America/Mexico_City")` al modelo User
   - Permite almacenar preferencia de zona horaria por usuario
   - Migración: `add_timezone_to_user`

2. **`super-coldy-api/src/services/auth.service.ts`**
   - Modificada interfaz `LoginResponse` para incluir `timezone`
   - Login devuelve `timezone: user.timezone || 'America/Mexico_City'`
   - El timezone se envía al frontend al iniciar sesión

3. **`super-coldy-api/src/services/user.service.ts`**
   - Agregado `timezone` a `UpdateUserInput` interface
   - Permite actualizar timezone mediante API: `PUT /api/users/:id`
   - Validación: solo el usuario o admin pueden modificar

4. **`La_-gran_michoacana/src/lib/utils.ts`**
   - Agregadas funciones `formatDate()`, `formatTime()`, `formatDateShort()`
   - Agregadas `getConfiguredTimezone()`, `setConfiguredTimezone()`
   - Exporta `MEXICO_TIMEZONES` con zonas disponibles
   - Sistema de fallback de 4 niveles para timezone
   - Convierten UTC a zona horaria configurada de forma segura

5. **`La_-gran_michoacana/src/stores/authStore.ts`**
   - Agregado campo `timezone?: string` a interfaz `User`
   - Se actualiza automáticamente al login
   - Persiste en localStorage via zustand middleware

6. **`La_-gran_michoacana/src/pages/SettingsPage.tsx`**
   - Agregado selector de zona horaria con 7 opciones
   - Vista previa de hora actual en la zona seleccionada
   - Sincroniza timezone en 3 lugares: Railway + localStorage + authStore
   - Explicación clara del funcionamiento para el usuario

7. **`super-coldy-api/src/services/sale.service.ts`**
   - NO se envía `createdAt` manualmente
   - Prisma lo asigna automáticamente del servidor

8. **`super-coldy-api/src/services/product.service.ts`**
   - Movimientos de inventario usan hora del servidor

### Flujo de Sincronización de Timezone

```
Usuario cambia timezone en SettingsPage
          ↓
1. Guardar en Railway (PUT /api/users/:id)
          ↓
2. Guardar en localStorage
          ↓
3. Actualizar authStore
          ↓
4. Toda la app usa getConfiguredTimezone()
          ↓
   Prioridad: Railway > localStorage > Browser > Default
```

---

## 🛡️ Protección Contra Manipulación

### Lo que NO puede hacer un empleado malicioso:

❌ Cambiar la hora del servidor PostgreSQL (requiere acceso root al servidor)  
❌ Modificar fechas ya guardadas en la BD (protegido por permisos)  
❌ Manipular timestamps al crear ventas (asignados por el servidor)  
❌ Alterar reportes históricos (fechas inmutables en UTC)  
❌ Cambiar la zona horaria para alterar registros (solo afecta visualización)

### Lo que SÍ puede hacer (y es normal):

✅ Ver las ventas en su hora local  
✅ Cambiar la zona horaria de visualización  
✅ Filtrar reportes por su zona horaria  
✅ Imprimir tickets con la hora local

---

## 🌍 Zonas Horarias

### Tu Caso Específico
- **PostgreSQL (Railway)**: Guarda en UTC
- **Tu computadora**: UTC-6 (probablemente Ciudad de México)
- **Diferencia**: 6 horas

### Ejemplo
```
Venta realizada a las 2:30 PM hora local (tu computadora)

Base de Datos guarda: 2026-02-16T20:30:00.000Z (UTC)
                      ↓
Frontend muestra:     16/02/2026, 14:30:00 (UTC-6)
```

---

## 📱 Cómo Usar las Funciones

### En tus componentes React:

```tsx
import { formatDate, formatTime, formatDateShort } from '@/lib/utils';

// Mostrar fecha completa con hora
{formatDate(sale.createdAt)}
// Output: "16/02/2026, 14:30:45"

// Solo la hora
{formatTime(sale.createdAt)}
// Output: "2:30 PM"

// Fecha corta para reportes
{formatDateShort(sale.createdAt)}
// Output: "16 feb 2026"

// Sin hora
{formatDate(sale.createdAt, false)}
// Output: "16/02/2026"
```

### Ejemplo en ReportsPage:

```tsx
// ❌ ANTES (mostraba hora UTC)
<p>Fecha: {new Date(sale.createdAt).toLocaleDateString()}</p>

// ✅ AHORA (convierte a zona horaria configurada)
<p>Fecha: {formatDate(sale.createdAt)}</p>
```

---

## 🔍 Verificación

### Para confirmar que las fechas son correctas:

1. **En Prisma Studio:**
   ```
   Fecha guardada: 2026-02-16T20:30:00.000Z (UTC)
   ```

2. **En la aplicación:**
   ```
   Fecha mostrada: 16/02/2026, 14:30:00 (tu hora local)
   ```

3. **Diferencia:**
   ```
   20:30 (UTC) - 6 horas = 14:30 (Ciudad de México)
   ✅ Correcto
   ```

---

## 🚨 Reglas de Oro

1. **NUNCA** usar `new Date()` del cliente para datos críticos
2. **SIEMPRE** guardar en UTC en la base de datos
3. **SOLO** convertir a hora local en visualización
4. **CONFIAR** en el servidor, no en el cliente
5. **VALIDAR** permisos y roles de usuario
6. **CONFIGURAR** zona horaria solo afecta visualización
7. **PERSISTIR** configuraciones importantes en Railway, no solo en localStorage
8. **SINCRONIZAR** entre múltiples fuentes con sistema de fallback

---

## ✅ Estado de Implementación

### Completado ✓
- [x] Campo `timezone` agregado al modelo User en Prisma
- [x] Migración `add_timezone_to_user` creada y desplegada
- [x] Cliente Prisma regenerado con nuevo schema
- [x] Auth service devuelve timezone en login
- [x] User service permite actualizar timezone
- [x] Frontend sincroniza timezone en Railway + localStorage + authStore
- [x] Sistema de fallback de 4 niveles implementado
- [x] SettingsPage actualizada con selector de timezone
- [x] Servidor API reiniciado y funcionando
- [x] Documentación actualizada

### Probado ✓
- [x] Login devuelve timezone correctamente
- [x] API responde a peticiones de productos y usuarios
- [x] Aplicación Electron se conecta al API exitosamente

### Listo para Producción ✓
El sistema está completamente implementado y funcionando. El timezone se guarda en Railway y persiste entre dispositivos y sesiones.

---

## 📌 Siguiente Paso Recomendado

Para mayor seguridad, implementar:

1. **Logs de auditoría** - Registrar quién, cuándo, desde dónde
2. **Validación de horarios** - Alertar si hay ventas fuera de horario
3. **Monitoreo de patrones** - Detectar comportamientos anómalos
4. **Backup automático** - Proteger datos contra modificaciones

---

## 🆘 Soporte

Si necesitas hacer consultas por fecha:

```typescript
// Para filtrar ventas de HOY (hora local)
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

// El servidor convertirá a UTC automáticamente
const sales = await saleService.getSalesByDateRange(
  today.toISOString(),  
  tomorrow.toISOString()
);
```

---

**Fecha de actualización:** 16 de febrero de 2026  
**Implementado por:** GitHub Copilot  
**Estado:** ✅ COMPLETADO - Timezone persistente en Railway con sistema de fallback multi-nivel
