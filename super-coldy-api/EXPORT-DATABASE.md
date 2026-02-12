# 💾 Guía de Exportación de Base de Datos Railway

Esta guía te mostrará cómo exportar tu base de datos PostgreSQL desde Railway.

## 🎯 Métodos Disponibles

### Método 1: Railway CLI (Recomendado) ⭐

El más sencillo si tienes Railway CLI instalado.

```powershell
# Ejecutar el script automatizado
.\scripts\export-railway-db.ps1
```

**¿Qué hace?**
- Verifica que tengas Railway CLI instalado
- Te autentica si es necesario
- Ejecuta pg_dump a través de Railway
- Crea un archivo `backup_railway_FECHA.sql`

---

### Método 2: URL de Conexión Manual

Si prefieres hacerlo manualmente con la URL de conexión.

```powershell
# Ejecutar el script con URL manual
.\scripts\export-railway-db-manual.ps1
```

**Pasos:**
1. Ve a [railway.app](https://railway.app)
2. Selecciona tu proyecto
3. Click en el servicio PostgreSQL
4. Ve a la pestaña "Variables"
5. Copia el valor de `DATABASE_URL`
6. Pégalo cuando el script lo solicite

---

### Método 3: Exportar a JSON

Exporta todos los datos a archivos JSON (útil para migración o análisis).

```powershell
# Cambiar a la URL de Railway temporalmente
$env:DATABASE_URL = "TU_URL_DE_RAILWAY"

# Ejecutar exportación
npx tsx scripts/export-to-json.ts
```

**Genera:**
- `users.json` - Usuarios (sin contraseñas)
- `products.json` - Productos
- `sales.json` - Ventas con items
- `inventory_movements.json` - Movimientos de inventario
- `_summary.json` - Resumen de la exportación

---

## 📋 Requisitos Previos

### Para Método 1 (Railway CLI):

```powershell
# Instalar Railway CLI
npm install -g @railway/cli

# Verificar instalación
railway --version

# Autenticar
railway login
```

### Para Método 2 (Manual):

Necesitas tener PostgreSQL client tools instalado:

**Windows:**
1. Descarga desde: https://www.postgresql.org/download/windows/
2. Durante instalación, asegúrate de incluir "Command Line Tools"
3. Verifica: `pg_dump --version`

**Alternativa con Chocolatey:**
```powershell
choco install postgresql
```

---

## 🔄 Restaurar un Backup

### En base de datos local:

```powershell
# Restaurar en PostgreSQL local
psql -U postgres -d supercoldy_pos < backup_railway_2026-02-11_143022.sql
```

### En otra base de datos de Railway:

```powershell
# Método 1: Con Railway CLI
railway run psql $DATABASE_URL < backup_railway_2026-02-11_143022.sql

# Método 2: Con URL directa
psql "postgresql://usuario:password@host:puerto/database" < backup_railway_2026-02-11_143022.sql
```

---

## 📊 Backup Programado

Para hacer backups automáticos, puedes usar Windows Task Scheduler:

```powershell
# Crear tarea programada (ejemplo: diario a las 2 AM)
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
  -Argument "-File C:\FreeLancer\super-coldy-pos\La_-gran_michoacana\super-coldy-api\scripts\export-railway-db.ps1"

$trigger = New-ScheduledTaskTrigger -Daily -At 2am

Register-ScheduledTask -TaskName "Backup Railway DB" `
  -Action $action -Trigger $trigger `
  -Description "Backup diario de base de datos Railway"
```

---

## 🔐 Seguridad

⚠️ **IMPORTANTE:**

1. **Los archivos de backup contienen datos sensibles**
   - No los subas a repositorios públicos
   - Agrégalos a `.gitignore`

2. **Cifra los backups importantes:**
   ```powershell
   # Comprimir y cifrar con 7-Zip
   7z a -p backup_railway_2026-02-11.7z backup_railway_2026-02-11.sql
   ```

3. **Almacena en lugar seguro:**
   - OneDrive/Google Drive (privado)
   - Disco duro externo
   - Servicio de backup en la nube

---

## 📁 Estructura de Archivos

```
super-coldy-api/
├── scripts/
│   ├── export-railway-db.ps1         # Script Railway CLI
│   ├── export-railway-db-manual.ps1  # Script manual
│   └── export-to-json.ts             # Exportar a JSON
├── exports/                           # Carpeta de exportaciones JSON
│   └── export_2026-02-11T14-30-22/
│       ├── users.json
│       ├── products.json
│       ├── sales.json
│       ├── inventory_movements.json
│       └── _summary.json
└── backup_railway_*.sql              # Backups SQL
```

---

## ❓ Solución de Problemas

### Error: "pg_dump: command not found"

Instala PostgreSQL client tools (ver requisitos arriba).

### Error: "authentication failed"

Verifica que la URL de conexión sea correcta:
```powershell
# Probar conexión
psql "TU_DATABASE_URL" -c "SELECT version();"
```

### El backup está vacío

Verifica que tengas permisos de lectura en la base de datos:
```powershell
railway run psql $DATABASE_URL -c "\dt"
```

### Timeout en la exportación

Para bases de datos muy grandes, aumenta el timeout:
```powershell
$env:PGCONNECT_TIMEOUT = "600"  # 10 minutos
```

---

## 💡 Tips

1. **Backups regulares:** Haz backup antes de:
   - Actualizar el schema de la base de datos
   - Hacer cambios masivos de datos
   - Actualizar versiones de Prisma

2. **Verifica los backups:**
   ```powershell
   # Ver primeras líneas del backup
   Get-Content backup_railway_*.sql -Head 50
   ```

3. **Mantén múltiples versiones:**
   Los scripts incluyen timestamp, manteniendo histórico automáticamente.

---

## 📞 Soporte

Si tienes problemas:
1. Verifica los logs del script
2. Revisa la documentación de Railway: https://docs.railway.app/
3. Consulta la documentación de PostgreSQL: https://www.postgresql.org/docs/
