# Servidor de Actualizaciones README

Este directorio contiene el servidor de actualizaciones para Super Coldy POS.

## 📁 Estructura

```
update-server/
├── Dockerfile          ← Configuración de NGINX
├── releases/           ← Instaladores y metadatos
│   ├── Super Coldy POS Setup 1.0.0.exe
│   ├── Super Coldy POS Setup 1.0.1.exe
│   └── latest.yml      ← Archivo de metadatos (IMPORTANTE)
└── README.md          ← Este archivo
```

## 🚀 Deploy Inicial a Railway

1. **Instalar Railway CLI:**
   ```powershell
   npm install -g @railway/cli
   railway login
   ```

2. **Crear releases folder:**
   ```powershell
   mkdir releases
   ```

3. **Copiar primer instalador:**
   ```powershell
   copy ..\..\La_-gran_michoacana\release\*.exe releases\
   copy ..\..\La_-gran_michoacana\release\latest.yml releases\
   ```

4. **Deploy:**
   ```powershell
   railway init
   railway up
   ```

5. **Generar dominio:**
   - Ir a Railway Dashboard
   - Settings → Generate Domain
   - Copiar URL (ej: `supercoldy-updates.up.railway.app`)

6. **Actualizar package.json:**
   - Editar `La_-gran_michoacana/package.json`
   - Cambiar URL en `build.publish.url` con la URL de Railway

## 📤 Publicar Nueva Versión

```powershell
# Desde La_-gran_michoacana/
npm version 1.0.1 --no-git-tag-version
npm run build:win

# Copiar archivos
copy release\*.exe ..\packages\update-server\releases\
copy release\latest.yml ..\packages\update-server\releases\

# Deploy
cd ..\packages\update-server
railway up
```

## 🔍 Verificar Deployment

```powershell
# Ver latest.yml
curl https://TU-DOMINIO.railway.app/latest.yml

# Ver listado de archivos
curl https://TU-DOMINIO.railway.app/
```

## 🎯 latest.yml

Este archivo es **crítico** para las actualizaciones. Contiene:

```yaml
version: 1.0.1
files:
  - url: Super Coldy POS Setup 1.0.1.exe
    sha512: abc123...
    size: 89543211
path: Super Coldy POS Setup 1.0.1.exe
sha512: abc123...
releaseDate: '2026-02-17T10:30:00.000Z'
```

- ✅ Sin caché (siempre se obtiene la última versión)
- ✅ CORS habilitado
- ✅ Generado automáticamente por electron-builder

## 🔧 Troubleshooting

### Error: "Cannot access update server"
- Verificar que Railway está activo
- Comprobar URL en package.json
- Ver logs: `railway logs`

### Error: "CORS blocked"
- El Dockerfile ya incluye configuración CORS
- Verificar: `curl -I https://TU-DOMINIO.railway.app/`

### Archivos no se actualizan
- Asegurarse de copiar `latest.yml` también
- Verificar que `railway up` completó exitosamente
- Limpiar caché del navegador

## 📊 Logs de Railway

```powershell
# Ver logs en vivo
railway logs

# Logs de un servicio específico
railway logs -s update-server
```

## 💰 Costos

Railway ofrece:
- **$5/mes** de crédito gratuito
- **Nginx estático**: ~$0.50-1.00/mes
- Ideal para distribución de actualizaciones

## 🔐 Seguridad

- ✅ HTTPS automático por Railway
- ✅ SHA512 checksum en latest.yml
- ✅ Electron verifica integridad antes de instalar
- ⚠️ Para producción: firmar instaladores con certificado

## 📚 Referencias

- [Railway Docs](https://docs.railway.app/)
- [electron-updater](https://www.electron.build/auto-update)
- [NGINX Config](https://nginx.org/en/docs/)
