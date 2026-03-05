# Sistema de Auditoría y Caja Inicial de Sucursales

## 📋 Descripción

Este documento explica las nuevas funcionalidades agregadas al sistema:

1. **Caja Inicial por Sucursal**: Cada sucursal puede tener un monto de caja inicial configurado
2. **Sistema de Auditoría**: Registro completo de todas las modificaciones realizadas en el sistema

---

## 🏦 Caja Inicial de Sucursales

### Campo agregado en Branch

```typescript
{
  initialCash: Decimal // Monto de caja inicial (por defecto: 0)
}
```

### API Endpoints

#### 1. Crear sucursal con caja inicial

```http
POST /api/branches
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Sucursal Centro",
  "address": "Av. Principal #123",
  "phone": "555-1234",
  "initialCash": 500.00
}
```

#### 2. Actualizar sucursal (incluyendo caja inicial)

```http
PUT /api/branches/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Sucursal Centro",
  "initialCash": 1000.00
}
```

#### 3. Actualizar SOLO la caja inicial

```http
PATCH /api/branches/:id/initial-cash
Authorization: Bearer <token>
Content-Type: application/json

{
  "initialCash": 750.00
}
```

**Permisos requeridos**: ADMIN o GERENTE

---

## 📝 Sistema de Auditoría

### Tabla AuditLog

Almacena un registro de todas las acciones importantes realizadas en el sistema:

```typescript
{
  id: number;
  userId: number | null;           // Usuario que realizó la acción
  branchId: number | null;         // Sucursal relacionada
  action: AuditAction;             // Tipo de acción
  entity: string;                  // Entidad afectada (Branch, Product, Sale, etc.)
  entityId: number | null;         // ID del registro afectado
  description: string;             // Descripción legible de la acción
  oldValues: string | null;        // JSON con valores anteriores
  newValues: string | null;        // JSON con valores nuevos
  ipAddress: string | null;        // IP desde donde se realizó
  userAgent: string | null;        // Navegador/dispositivo usado
  createdAt: Date;                 // Fecha y hora de la acción
}
```

### Tipos de Acciones (AuditAction)

- `CREATE`: Creación de un registro
- `UPDATE`: Actualización de un registro
- `DELETE`: Eliminación de un registro
- `LOGIN`: Inicio de sesión
- `LOGOUT`: Cierre de sesión
- `OPEN_CASH_REGISTER`: Apertura de caja
- `CLOSE_CASH_REGISTER`: Cierre de caja

### API Endpoints de Auditoría

#### 1. Obtener todos los logs (solo ADMIN)

```http
GET /api/audit/logs
Authorization: Bearer <token>

Query Parameters (opcionales):
  - userId: number
  - branchId: number
  - entity: string
  - action: AuditAction
  - startDate: ISO8601 date
  - endDate: ISO8601 date
  - limit: number (1-200, default: 50)
  - offset: number (default: 0)
```

**Ejemplo de respuesta:**

```json
{
  "status": "success",
  "data": {
    "logs": [
      {
        "id": 1,
        "userId": 1,
        "user": {
          "id": 1,
          "username": "admin",
          "fullName": "Administrador",
          "email": "admin@supercoldy.com"
        },
        "branchId": 8,
        "branch": {
          "id": 8,
          "name": "Sucursal Principal"
        },
        "action": "UPDATE",
        "entity": "Branch",
        "entityId": 8,
        "description": "Caja inicial actualizada en Sucursal Principal: $500 → $750",
        "oldValues": {
          "initialCash": 500
        },
        "newValues": {
          "initialCash": 750
        },
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2026-03-05T21:45:00.000Z"
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

#### 2. Obtener logs de una sucursal específica

```http
GET /api/audit/branches/:branchId
Authorization: Bearer <token>

Query Parameters (opcionales):
  - startDate: ISO8601 date
  - endDate: ISO8601 date
  - limit: number (1-200, default: 50)
  - offset: number (default: 0)
```

**Permisos requeridos**: ADMIN o GERENTE

#### 3. Obtener logs de un usuario específico

```http
GET /api/audit/users/:userId
Authorization: Bearer <token>

Query Parameters (opcionales):
  - startDate: ISO8601 date
  - endDate: ISO8601 date
  - limit: number (1-200, default: 50)
  - offset: number (default: 0)
```

**Permisos requeridos**: ADMIN

---

## 💻 Uso Programático

### Registrar una acción en la auditoría

```typescript
import { createAuditLog, AuditAction, getRequestInfo } from '../utils/auditLogger.js';

// En un controlador/servicio
async function updateSomething(req, data) {
  const { ipAddress, userAgent } = getRequestInfo(req);
  
  // Realizar la actualización...
  const oldData = await getOldData();
  const newData = await updateData(data);
  
  // Registrar en auditoría
  await createAuditLog({
    userId: req.user?.userId,
    branchId: data.branchId,
    action: AuditAction.UPDATE,
    entity: 'EntityName',
    entityId: newData.id,
    description: 'Descripción de lo que se hizo',
    oldValues: oldData,
    newValues: newData,
    ipAddress,
    userAgent,
  });
}
```

### Consultar logs de auditoría

```typescript
import { getAuditLogs } from '../utils/auditLogger.js';

// Obtener logs de los últimos 7 días
const result = await getAuditLogs({
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  endDate: new Date(),
  limit: 100,
});

console.log(`Total de logs: ${result.total}`);
result.logs.forEach(log => {
  console.log(`${log.user?.username} - ${log.description}`);
});
```

---

## 🔄 Migración Aplicada

La migración `20260305213727_add_initial_cash_and_audit_log` incluye:

1. Nuevo campo `initialCash` en la tabla `Branch` (tipo DECIMAL, default 0)
2. Nueva tabla `AuditLog` con todos sus campos e índices
3. Nuevo enum `AuditAction` con los tipos de acciones

---

## ✅ Verificación

Para verificar que todo está funcionando:

```bash
# 1. Verificar que la migración se aplicó
npx prisma migrate status

# 2. Limpiar base de datos con los nuevos campos
npx tsx prisma/clean-database.ts

# 3. La sucursal creada debe tener initialCash: $500
# 4. Debe haberse creado un log de auditoría inicial
```

---

## 📊 Ejemplos de Uso

### Ejemplo 1: Ver cambios en caja inicial de sucursales

```bash
GET /api/audit/logs?entity=Branch&limit=10
```

### Ejemplo 2: Ver todas las acciones de un usuario

```bash
GET /api/audit/users/1?startDate=2026-03-01&endDate=2026-03-31
```

### Ejemplo 3: Ver historial de una sucursal

```bash
GET /api/audit/branches/8?limit=50
```

---

## 🚀 Próximos Pasos

1. **Frontend**: Crear pantalla de auditoría para visualizar logs
2. **Reportes**: Agregar exportación de logs a Excel/PDF
3. **Alertas**: Notificar cambios importantes (ej: caja inicial > $10,000)
4. **Filtros Avanzados**: Agregar búsqueda por texto en descripción

---

## 🔐 Seguridad

- Los logs de auditoría son **inmutables** (no se pueden editar ni eliminar)
- Solo usuarios ADMIN pueden ver todos los logs
- Los GERENTES solo pueden ver logs de sus sucursales
- La IP y User-Agent se guardan para trazabilidad completa

---

## 📞 Soporte

Para más información o problemas, contacta al equipo de desarrollo.
