# Guía de Actualización - La Gran Michoacana POS

## 📋 Resumen

Tienes **dos opciones** para actualizar la aplicación instalada en tu PC:

### Opción 1: Actualización Automática ⚡ (Recomendada)
La aplicación **se actualiza sola automáticamente** cuando:
- Detecta una nueva versión disponible
- Descarga e instala sin intervención manual
- Se aplica al reiniciar la aplicación

### Opción 2: Actualización Manual 🔧
Compilar y crear un nuevo instalador manualmente desde la línea de comandos.

---

## 🔄 Opción 1: Actualización Automática (Recomendada)

### Cómo Funciona

```
Código actualizado → Compilar versión → Subirlo a Railway → 
App detecta actualización → Descarga → Instala → Notifica usuario
```

### Paso a Paso

#### 1️⃣ Actualizar el código en tu repositorio

```bash
# En la carpeta del proyecto
cd c:\programas_programables\super-coldy-pos\La_-gran_michoacana

# Git push con los cambios
git add .
git commit -m "Feat: agregar soporte para zonas horarias en lectura"
git push origin main  # o tu rama
```

#### 2️⃣ Compilar y publicar automáticamente

**Opción A: Desde tu PC (requiere certificado)**

```bash
# En La_-gran_michoacana/
cd La_-gran_michoacana

# Compilar y publicar (para Windows sin firma de código)
npm run build:publish
```

**Nota:** Desactiva la búsqueda de certificado:
```bash
set CSC_IDENTITY_AUTO_DISCOVERY=false
npm run build:publish
```

**Opción B: Con CI/CD en Railway (Automático)**

Si tienes configurado Railway con GitHub Actions, el deploy automático publicará la actualización directamente.

#### 3️⃣ La aplicación se actualiza automáticamente

Cuando el usuario abre la app nuevamente:

1. La app **verifica actualizaciones** automáticamente
2. Si hay una versión nueva → **la descarga**
3. Muestra una notificación: *"Actualización disponible"*
4. Al reiniciar la app → **se instala automáticamente**

---

## 🔧 Opción 2: Actualización Manual

### Paso a Paso

#### 1️⃣ Asegúrate de que los cambios estén guardados

```bash
cd c:\programas_programables\super-coldy-pos\La_-gran_michoacana\La_-gran_michoacana

# Verificar que todo esté guardado
git status
```

#### 2️⃣ Instala dependencias (si hay cambios en package.json)

```bash
npm install
```

#### 3️⃣ Compila la versión

**Opción A: Compilación normal**
```bash
npm run build
```

**Opción B: Compilación con publicación (recomendado)**
```bash
set CSC_IDENTITY_AUTO_DISCOVERY=false
npm run build:publish
```

#### 4️⃣ El instalador se crea en

```
La_-gran_michoacana/release/
```

Busca el archivo `.exe` generado.

#### 5️⃣ Desinstala la versión antigua

- Ve a **Panel de Control > Programas y características**
- Busca **"La Gran Michoacana"**
- Haz clic en **Desinstalar**

#### 6️⃣ Instala la nueva versión

- Abre el nuevo archivo `.exe` generado
- Sigue el instalador
- Listo ✅

---

## 📊 Comparación

| Característica | Auto | Manual |
|---|---|---|
| **Actualización automática** | ✅ Sí | ❌ Manual |
| **Requiere intervención** | ❌ No | ✅ Sí |
| **Tiempo** | ⚡ Rápido | 🐢 Lento |
| **Riesgo de errores** | 📉 Bajo | 📈 Alto |
| **Recomendado** | ✅✅✅ | ✅ (backup) |

---

## 🔐 Configuración del Auto-Updater

### Ubicación: `La_-gran_michoacana/package.json`

```json
"publish": {
  "provider": "generic",
  "url": "https://update-server-production-7900.up.railway.app/"
}
```

### ¿Dónde se suben las releases?

Las compiladas se suben automáticamente a:
```
packages/update-server/releases/
```

Que están sincronizadas con Railway en:
```
https://update-server-production-7900.up.railway.app/
```

---

## 🚨 Solución de Problemas

### La actualización no se detecta

```bash
# 1. Verifica que el servidor esté activo
# Ve a: https://update-server-production-7900.up.railway.app/

# 2. Fuerza una verificación manual desde la app
# En SettingsPage o desde DevTools:
# window.api?.checkForUpdates?.()

# 3. Revisa los logs en
# C:\Users\{usuario}\AppData\Roaming\La Gran Michoacana\logs\
```

### Error al instalar actualización

1. **Cierra la aplicación completamente**
2. **Reinicia la aplicación**
3. La instalación debería continuar automáticamente

### Los cambios no aparecen

```bash
# Asegúrate de haber compilado correctamente
npm run build:win

# Verifica que el release esté en
ls release/
```

---

## 📝 Flujo Recomendado

Para futuras actualizaciones:

```bash
# 1. Haz tus cambios (ej: cambios de timezone)
git add .
git commit -m "Descripción clara del cambio"

# 2. Actualiza la versión en package.json
# Cambia: "version": "1.0.1" → "version": "1.0.2"

# 3. Compila y publica
set CSC_IDENTITY_AUTO_DISCOVERY=false
npm run build:publish

# 4. El usuario verá la actualización automáticamente
# en su PC la próxima vez que abra la app
```

---

## ✅ Checklist para Actualizar

- [ ] Cambios guardados en Git
- [ ] `version` actualizada en `package.json`
- [ ] Ejecutar `npm run build:publish`
- [ ] Archivo .exe générée en `release/`
- [ ] Server de actualización disponible (Railway)
- [ ] Usuario abre la app → detecta actualización
- [ ] Instalación automática ✨

---

## 🎯 Para los Cambios Actuales de Timezone

Si quieres actualizar **ahora** con los cambios de timezone:

```bash
cd "c:\programas_programables\super-coldy-pos\La_-gran_michoacana\La_-gran_michoacana"

# Actualizar versión
# Edita package.json: "version": "1.0.2"

# Compilar con publicación
set CSC_IDENTITY_AUTO_DISCOVERY=false
npm run build:publish

# Espera a que termine (5-10 minutos)
# El archivo .exe estará en ./release/

# Desinstala la versión vieja desde Panel de Control
# Instala el nuevo .exe

# ¡Listo!
```

---

## 📞 Notas

- **Auto-updater deshabilitado en desarrollo** (`npm run dev`)
- **Solo activo en builds de producción** (instalador .exe)
- **Verifica cada 4 horas** automáticamente después de iniciar
- **Se instala automáticamente al cerrar la app** si hay actualización descargada

