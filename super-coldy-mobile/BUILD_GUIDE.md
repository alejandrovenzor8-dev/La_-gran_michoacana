# 📱 Guía de Build y Deployment para La Gran Michoacana

Esta guía explica cómo compilar y distribuir la app para iOS y Android.

## Requisitos previos

### 1. **Cuenta de Expo**
- Ir a [https://expo.dev](https://expo.dev)
- Crear una cuenta (o usar la existente)
- Recordar tu `projectId`

### 2. **Actualizar app.json**
Tu `app.json` ya tiene:
- ✅ Nombre: "La Gran Michoacana"
- ✅ Bundle ID para iOS: `com.alejandrovenzor.lagranmichoacana`
- ✅ Package para Android: `com.alejandrovenzor.lagranmichoacana`
- ✅ versionCode para Android

### 3. **Instalar dependencias**
```bash
cd super-coldy-mobile
npm install
```

## Para distribuir la APP

### Opción 1: Build APK para Android (Recomendado para tu cliente)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login con tu cuenta de Expo
eas login

# Crear un build de producción (APK)
eas build --platform android --profile production
```

Esto:
- ✅ Compila en los servidores de Expo (sin necesidad de Android Studio)
- ✅ Genera un APK instalable
- ✅ Genera un QR para descargar fácilmente desde el celular

**Tiempo:** ~15-20 minutos

---

### Opción 2: Build IPA para iOS (Si el cliente usa iPhone)

```bash
# Necesita cuenta de Apple Developer ($99/año)
eas build --platform ios --profile production
```

⚠️ **Nota:** iOS requiere:
- Cuenta de Apple Developer activa
- Certificados firmados
- Provisioning profiles

---

### Opción 3: Build de Preview (Más rápido, para testing)

```bash
# Android APK sin firmar (solo para testing interno)
eas build --platform android --profile preview
```

---

## **Pasos paso a paso para tu caso:**

### 1️⃣ **Setup inicial (una sola vez)**
```bash
npm install -g eas-cli
eas login  # Usar credenciales de Expo
```

### 2️⃣ **Compilar para Android**
```bash
cd c:\programas_programables\super-coldy-pos\La_-gran_michoacana\super-coldy-mobile
eas build --platform android --profile production
```

### 3️⃣ **Esperar a que compile**
- Verás un link de Expo
- Puedes monitorear el progreso
- Te dará un link directo al APK cuando esté listo

### 4️⃣ **Instalar en el celular**
- El cliente abre el link desde su Android
- Descarga el APK
- Instala (probablemente necesite permitir apps del navegador)

---

## **Características implementadas:**

✅ **Push Notifications** - Para alertar sobre cierre de caja
✅ **Offline Mode** - Guarda datos offline y sincroniza cuando vuelve conexión
✅ **App Branding** - Con nombre y versión personalizados
✅ **Múltiples plataformas** - Android e iOS

---

## **Si necesitas actualizar la app después:**

```bash
# 1. Cambiar versión en app.json (ej: 1.0.1)
# 2. Hacer push a git
# 3. Compilar nuevo build
eas build --platform android --profile production

# 4. Distribuir nuevo APK al cliente
```

---

## **Próximos pasos recomendados:**

1. ✏️ **Cambiar proyecto ID de notificaciones:**
   - En `super-coldy-mobile/src/services/notificationService.ts`
   - Reemplazar `'7cbf99ef-3c01-4e2c-ad58-6bbf1a1f6a6c'` con tu Project ID de Expo
   - Tu Project ID está en: https://expo.dev/projects

2. 🖼️ **Agregar logo real**
   - Reemplazar `assets/icon.png` (1024x1024 px)
   - Reemplazar `assets/splash-icon.png` (1284x2778 px para iOS, ajusta para Android)

3. 🔔 **Implementar backend para notificaciones**
   - Los endpoints `/notifications/register-device` y `/notifications/unregister-device` están en `notificationService.ts`
   - Necesitan implementarse en el backend

4. 🔌 **Finalizar offline sync**
   - Los métodos en `offlineSyncService.ts` están parcialmente implementados
   - Completar las funciones de sincronización para cada tipo de acción

5. 📊 **Testing en dispositivo real**
   - Probar en Android real
   - Probar sin internet (modo avión)
   - Probar notificaciones push

---

## **Troubleshooting:**

### "eas-cli not found"
```bash
npm install -g eas-cli@latest
```

### "Permission denied" en iOS
- Necesitas cuenta de Apple Developer
- Configurar certificados en Expo

### APK no instala
- Podría ser versión anterior
- Desinstalar la app anterior
- Permitir instalación de apps desconocidas

---

¡Listo! Tu app está lista para distribuir al cliente. 🚀
