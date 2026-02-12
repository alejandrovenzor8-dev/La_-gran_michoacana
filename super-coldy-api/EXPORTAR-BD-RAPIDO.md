# 🚀 Exportar Base de Datos Railway - GUÍA RÁPIDA

## ✅ Método 1: Railway CLI (MÁS FÁCIL)

### Paso 1: Instalar Railway CLI
```powershell
npm install -g @railway/cli
```

### Paso 2: Autenticarse
```powershell
railway login
```

### Paso 3: Conectarse a tu proyecto
```powershell
# Listar tus proyectosss
railway list

# Linkear al proyecto correcto (selecciónalo del menú)
railway link
```

### Paso 4: Exportar la base de datos
```powershell
# Crear backup con fecha
railway run pg_dump '$DATABASE_URL' > backup_railway_$(Get-Date -Format 'yyyy-MM-dd_HHmmss').sql
```

---

## 🔧 Método 2: URL Directa (SIN RAILWAY CLI)

### Paso 1: Obtener URL de conexión
1. Ve a [railway.app](https://railway.app)
2. Selecciona tu proyecto
3. Click en el servicio **PostgreSQL**
4. Pestaña **"Variables"**
5. Copia el valor de **`DATABASE_URL`**

### Paso 2: Exportar con pg_dump

```powershell
# Reemplaza la URL con la tuya
pg_dump "postgresql://usuario:password@host:puerto/database" -f backup_railway.sql
```

**⚠️ Nota:** Necesitas PostgreSQL instalado. Si no lo tienes:
- Descarga: https://www.postgresql.org/download/windows/
- O instala solo las tools: https://www.enterprisedb.com/download-postgresql-binaries

---

## 📦 Método 3: Exportar a JSON (SIN DEPENDENCIAS)

Usa el script TypeScript incluido:

```powershell
# 1. Configurar URL de Railway temporalmente
$env:DATABASE_URL = "postgresql://usuario:password@host:puerto/database"

# 2. Exportar
npx tsx scripts/export-to-json.ts
```

**Genera carpeta `exports/` con archivos JSON:**
- `users.json`
- `products.json`
- `sales.json`
- `inventory_movements.json`

---

## 🐛 Solución de Problemas

### Error: "pg_dump no se reconoce"
```powershell
# Opción A: Instalar PostgreSQL completo
winget install PostgreSQL.PostgreSQL

# Opción B: Usa el Método 3 (JSON) que no requiere pg_dump
```

### Error de permisos en PowerShell
```powershell
# Ejecutar PowerShell como Administrador y ejecutar:
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# Luego vuelve a intentar
```

### No puedo usar Railway CLI
👉 Usa el **Método 2** (URL directa) o el **Método 3** (JSON)

---

## 💾 Comandos de Una Línea

### Con Railway CLI (después de login y link):
```powershell
railway run pg_dump '$DATABASE_URL' > backup.sql
```

### Con URL directa:
```powershell
pg_dump "TU_DATABASE_URL_AQUI" -f backup.sql
```

### A JSON (más fácil):
```powershell
$env:DATABASE_URL = "TU_URL"; npx tsx scripts/export-to-json.ts
```

---

## 🔄 Restaurar Backup

```powershell
# En base de datos local
psql -U postgres -d supercoldy_pos -f backup.sql

# En Railway (con CLI)
railway run psql '$DATABASE_URL' < backup.sql
```

---

## 📞 ¿Necesitas Ayuda?

1. **¿No tienes PostgreSQL instalado?** → Usa Método 3 (JSON)
2. **¿Railway CLI no funciona?** → Usa Método 2 (URL directa)
3. **¿Error de permisos?** → Ejecuta PowerShell como Administrador
4. **¿Otro problema?** → Revisa la documentación completa en EXPORT-DATABASE.md
