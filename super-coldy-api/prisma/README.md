# Prisma Setup para Super Coldy Backend

## 📋 Descripción

Schema de base de datos para un sistema POS de paletería con soporte completo para:
- Gestión de usuarios y permisos
- Catálogo de productos
- Ventas y detalles de venta
- Movimientos de inventario
- Auditoria de cambios

## 🗄️ Modelos

### User (Usuarios del Sistema)
- Autenticación y autorización
- Roles: ADMIN, CAJERO, GERENTE
- Trazabilidad de operaciones

### Product (Catálogo)
- Información de productos
- Control de stock
- Precios de venta y costo
- Categorización y códigos de barras

### Sale (Ventas)
- Registro completo de transacciones
- Métodos de pago: EFECTIVO, TARJETA, MIXTO
- Cálculo de cambio
- Estados: COMPLETED, CANCELLED, REFUNDED

### SaleItem (Detalles de Venta)
- Items por venta
- Snapshot de precio y nombre
- Descuentos lineales

### InventoryMovement (Movimientos)
- Tipos: ENTRADA, SALIDA, AJUSTE, VENTA
- Trazabilidad completa de cambios
- Historial de stock

### Config (Configuración)
- Pares clave-valor para configuración global

## 🚀 Comandos Útiles

```bash
# Generar Prisma Client
npm run prisma:generate

# Crear y aplicar migraciones
npm run prisma:migrate

# Ver datos en interfaz gráfica
npm run prisma:studio

# Ejecutar seed de datos
npm run prisma:seed

# Resetear base de datos (⚠️ elimina datos)
npx prisma migrate reset
```

## 📝 Primeros Pasos

1. **Configurar DATABASE_URL en .env**
   ```
   DATABASE_URL="postgresql://usuario:password@localhost:5432/supercoldy_pos?schema=public"
   ```

2. **Ejecutar migraciones iniciales**
   ```bash
   npm run prisma:migrate
   ```

3. **Cargar datos iniciales (opcional)**
   ```bash
   npm run prisma:seed
   ```

4. **Verificar datos**
   ```bash
   npm run prisma:studio
   ```

## 🔒 Seguridad

- Los campos de precio usan `Decimal(10,2)` para precisión financiera
- Los totales usan `Decimal(12,2)` para evitar overflow
- Las contraseñas se hashean con bcryptjs
- Las relaciones con `onDelete: Cascade` en SaleItem aseguran integridad

## 📊 Índices de Performance

Incluidos para mejorar velocidad de consultas:
- `.username`, `.email` en User (búsquedas frecuentes)
- `.barcode`, `.category` en Product (filtrados comúnmente)
- `.saleId` en SaleItem (relaciones)
- `.productId` en InventoryMovement (relaciones)
- `.createdAt` en Sale (ordenamientos por fecha)

## 🛠️ Extending

Para agregar nuevos campos:

1. Editar `schema.prisma`
2. Ejecutar `npm run prisma:migrate` con un nombre descriptivo
3. El cliente se regenerará automáticamente

## 📚 Más Información

- [Documentación Prisma](https://www.prisma.io/docs)
- [Prisma CLI](https://www.prisma.io/docs/orm/reference/prisma-cli-reference)
