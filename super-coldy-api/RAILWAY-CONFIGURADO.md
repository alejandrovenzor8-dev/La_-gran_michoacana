# 🚀 Tu Base de Datos está LISTA en Railway!

## ✅ Estado Actual

Tu base de datos PostgreSQL en Railway está **configurada y funcionando**:

- ✅ **Tablas creadas** - Schema migrado completamente
- ✅ **Datos iniciales** - 2 usuarios, 4 productos, 2 ventas
- ✅ **Backup creado** - Exportado en `exports/export_2026-02-12T05-26-31/`

---

## 🔗 Información de Conexión

**URL de conexión Railway:**
```
postgresql://postgres:qsfORZNDPQAJZOFVQAtARENKSGEXsdcl@gondola.proxy.rlwy.net:29056/railway
```

⚠️ **IMPORTANTE:** Esta contraseña está expuesta. Después de configurar todo, cámbiala:
1. Ve a Railway → Tu Proyecto → PostgreSQL → Settings
2. Click en "**Reset Database Password**"
3. Actualiza la nueva contraseña en las variables de entorno

---

## 📝 Configuración del Proyecto

### 1. Archivos de Configuración Creados

```
super-coldy-api/
├── .env                    # Desarrollo local (PostgreSQL local)
├── .env.production         # Producción Railway (NUEVO)
└── .env.example            # Ejemplo actualizado con instrucciones
```

### 2. Para Desarrollo Local

Usa tu base de datos local (ya configurada en `.env`):
```bash
npm run dev
```

### 3. Para Railway (Producción)

#### Opción A: Variables de Entorno en Railway (Recomendado)

1. Ve a **Railway.app** → Tu proyecto → Servicio API
2. Pestaña **"Variables"**
3. Agrega estas variables:

```env
NODE_ENV=production
DATABASE_URL=(Ya existe automáticamente)
JWT_SECRET=genera_un_secreto_seguro
JWT_REFRESH_SECRET=otro_secreto_diferente
CORS_ORIGIN=https://tu-app.railway.app
```

**Generar secretos seguros:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object {[byte](Get-Random -Maximum 256)}))
```

#### Opción B: Usar archivo .env.production localmente

Para probar con Railway desde tu máquina local:

```powershell
# Copiar configuración de producción
cp .env.production .env

# O exportar variable temporalmente
$env:DATABASE_URL = "postgresql://postgres:TU_PASSWORD@gondola.proxy.rlwy.net:29056/railway"
npm run dev
```

---

## 🎯 Próximos Pasos

### 1. Hacer Commit

Los archivos `.env*` ya están protegidos en `.gitignore`. Puedes hacer commit seguro:

```bash
git add .
git commit -m "feat: configuración Railway y scripts de exportación de BD"
git push
```

### 2. Deploy en Railway

Si conectaste tu repositorio con Railway:
1. Railway detectará el push automáticamente
2. Ejecutará `npm run build`
3. Iniciará con `npm start`

### 3. Verificar Variables en Railway

Asegúrate de que estas variables estén configuradas:
- ✅ `DATABASE_URL` (automática)
- ✅ `NODE_ENV=production`
- ✅ `JWT_SECRET` (valor seguro)
- ✅ `JWT_REFRESH_SECRET` (valor seguro)
- ✅ `CORS_ORIGIN` (tu dominio)

---

## 📊 Datos Disponibles

Tu base de datos Railway tiene:

### Usuarios:
- **Admin:** `admin` / `admin123`
- **Vendedor:** `vendedor` / `vendedor123`

### Productos:
- 4 productos de ejemplo con precios y stock

### Ventas:
- 2 ventas de ejemplo con sus items

---

## 🔄 Scripts Útiles

### Exportar datos actuales:
```powershell
$env:DATABASE_URL = "TU_URL_RAILWAY"
npx tsx scripts/export-to-json.ts
```

### Agregar más datos de prueba:
```powershell
$env:DATABASE_URL = "TU_URL_RAILWAY"
npx tsx prisma/populate-test-data.ts  # 30 días de ventas
npx tsx prisma/add-today-sales.ts     # Solo ventas de hoy
```

### Verificar fechas:
```powershell
$env:DATABASE_URL = "TU_URL_RAILWAY"
npx tsx prisma/check-dates.ts
```

---

## 📦 Archivos que NO se suben a Git

Estos archivos están protegidos en `.gitignore`:
- ✅ `.env`
- ✅ `.env.production`
- ✅ `.env.local`
- ✅ `exports/` (backups)
- ✅ `backup_*.sql`

---

## 🐛 Solución de Problemas

### Error: "Can't reach database server"
- Verifica que estás usando la URL **pública** (`.proxy.rlwy.net`)
- NO uses la URL interna (`.railway.internal`)

### Error: "The table does not exist"
```powershell
# Ejecutar migraciones en Railway
$env:DATABASE_URL = "TU_URL_RAILWAY"
npx prisma migrate deploy
```

### Error de autenticación
- Verifica que la contraseña en DATABASE_URL sea correcta
- Si reseteaste la contraseña, actualiza la variable

---

## 📞 URLs de Referencia

- **Railway Dashboard:** https://railway.app
- **Documentación Completa:** [RAILWAY-SETUP.md](./RAILWAY-SETUP.md)
- **Guía de Exportación:** [EXPORT-DATABASE.md](./EXPORT-DATABASE.md)
- **Guía Rápida:** [EXPORTAR-BD-RAPIDO.md](./EXPORTAR-BD-RAPIDO.md)

---

## ✅ Checklist Final

- [x] Base de datos Railway creada
- [x] Migraciones ejecutadas
- [x] Datos iniciales cargados
- [x] Backup exportado
- [x] Archivos de configuración creados
- [x] `.gitignore` actualizado
- [ ] Variables de entorno en Railway configuradas
- [ ] Contraseña de BD cambiada (por seguridad)
- [ ] Commit y push realizado
- [ ] Deploy verificado

---

**🎉 ¡Todo listo para hacer commit y deploy!**
