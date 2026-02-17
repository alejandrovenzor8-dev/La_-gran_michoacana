# 📦 INICIO RÁPIDO: Sistema de Instalador y Actualizaciones

## 🎯 Para Desarrolladores

### **Crear Instalador (Primera Vez)**

```powershell
cd La_-gran_michoacana
npm install
npm run build:win
```

**Resultado**: `release/Super Coldy POS Setup 1.0.0.exe`

---

### **Publicar Actualización**

```powershell
# Opción A: Script automático
.\scripts\deploy-update.ps1 -Version "1.0.1"

# Opción B: Manual
npm version 1.0.1 --no-git-tag-version
npm run build:win

# Copiar a servidor (crear carpeta si no existe)
mkdir ..\packages\update-server\releases -Force
copy release\*.exe ..\packages\update-server\releases\
copy release\latest.yml ..\packages\update-server\releases\
```

---

### **Configurar Servidor de Actualizaciones (Una Vez)**

1. **Crear `packages/update-server/Dockerfile`:**

```dockerfile
FROM nginx:alpine

COPY releases/ /usr/share/nginx/html/

RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    location / { \
        add_header Access-Control-Allow-Origin *; \
        autoindex on; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
```

2. **Deploy a Railway:**

```bash
cd packages/update-server
railway up
```

3. **Obtener URL del servicio** (Railway Settings → Generate Domain)

4. **Actualizar `La_-gran_michoacana/package.json`:**

```json
{
  "build": {
    "publish": {
      "provider": "generic",
      "url": "https://TU-DOMINIO.railway.app/"
    }
  }
}
```

---

## 👥 Para Usuarios Finales

### **Instalación Inicial**

1. Descargar `Super Coldy POS Setup 1.0.0.exe`
2. Ejecutar instalador
3. Seguir asistente (Next → Next → Install)
4. Iniciar desde acceso directo del escritorio

### **Actualizaciones Automáticas**

El sistema se actualiza **automáticamente**:

- ✅ Verifica actualizaciones cada 4 horas
- ✅ Notificación visual cuando hay nueva versión
- ✅ Descarga en segundo plano
- ✅ Instala al cerrar la aplicación

**Pasos:**
1. Ver notificación "Nueva versión disponible"
2. Click en "Descargar"
3. Esperar a que descargue (barra de progreso)
4. Click en "Reiniciar e instalar" o cerrar normalmente
5. ¡Listo! 🎉

**Verificación manual:**
- Botón de engrane en esquina inferior derecha
- Click para buscar actualizaciones

---

## 🔧 Estructura del Proyecto

```
La_-gran_michoacana/
├── electron/
│   ├── main.ts          ← Lógica de auto-actualización
│   └── preload.ts       ← API de actualización expuesta al renderer
├── src/
│   ├── App.tsx          ← Incluye <UpdateNotification />
│   └── components/
│       └── UpdateNotification.tsx  ← UI de actualizaciones
├── scripts/
│   └── deploy-update.ps1  ← Script de deploy automático
├── release/             ← Instaladores generados
│   ├── Super Coldy POS Setup 1.0.0.exe
│   └── latest.yml
└── package.json         ← Configuración de electron-builder

packages/update-server/  ← Servidor de actualizaciones
├── Dockerfile
└── releases/
    ├── Super Coldy POS Setup 1.0.0.exe
    └── latest.yml
```

---

## 📊 Flujo Completo

```
┌─────────────────┐
│ Desarrollador   │
│ npm run build   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Instalador .exe │
│   + latest.yml  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Railway       │
│ (nginx server)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Aplicación     │
│  en cliente     │
│ (verifica cada  │
│   4 horas)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Notificación   │
│  al usuario     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Descarga e     │
│  instala auto   │
└─────────────────┘
```

---

## ⚡ Comandos Rápidos

```powershell
# Build completo
npm run build:win

# Solo compilar código
npm run build:electron
npm run build:vite

# Modo desarrollo
npm run dev

# Deploy con script
.\scripts\deploy-update.ps1 -Version "1.0.1"
```

---

## 🔍 Verificar Actualización

```powershell
# Ver latest.yml en Railway
curl https://tu-dominio.railway.app/latest.yml

# Ver logs de Electron
Get-Content "$env:APPDATA\Super Coldy POS\logs\main.log" -Tail 50
```

---

## 📚 Documentación Completa

Ver [INSTALADOR-Y-ACTUALIZACIONES.md](INSTALADOR-Y-ACTUALIZACIONES.md) para:
- Configuración detallada
- Troubleshooting
- Firma de código
- Seguridad
- Y más...

---

## ✅ Checklist de Release

- [ ] Incrementar versión en `package.json`
- [ ] `npm run build:win`
- [ ] Copiar archivos a `packages/update-server/releases/`
- [ ] `railway up`
- [ ] Verificar `https://dominio.railway.app/latest.yml`
- [ ] Notificar a usuarios (opcional)

---

**🎉 Sistema configurado y listo para producción!**

