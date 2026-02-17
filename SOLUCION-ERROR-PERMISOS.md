# Error de Permisos al Crear Instalador

## Problema
Windows no permite crear enlaces simbólicos sin privilegios especiales, causando que electron-builder falle al extraer herramientas de firma.

## Soluciones

### ✅ Opción 1: Habilitar Developer Mode (Recomendado)

1. Abrir **Configuración de Windows** (Win + I)
2. Ir a **Privacidad y seguridad** → **Para desarrolladores**
3. Activar **Modo de desarrollador**
4. Reiniciar PowerShell
5. Ejecutar: `npm run build:win`

### ✅ Opción 2: Ejecutar PowerShell como Administrador

1. Cerrar VSCode completamente
2. Buscar "PowerShell" en el menú Inicio
3. Click derecho → **Ejecutar como administrador**
4. Navegar al proyecto:
   ```powershell
   cd "c:\FreeLancer\super-coldy-pos\La_-gran_michoacana\La_-gran_michoacana"
   npm run build:win
   ```

### ✅ Opción 3: Crear Instalador Portable (Sin Permisos)

Ejecutar este comando:
```powershell
cd "c:\FreeLancer\super-coldy-pos\La_-gran_michoacana\La_-gran_michoacana"
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"
npm run build:electron
vite build
npx electron-builder --win portable --config.win.sign=false
```

El instalador portable (.exe) no requiere permisos de administrador y funciona directamente.

## ¿Cuál elegir?

- **Developer Mode**: Mejor para desarrollo continuo
- **Como Administrador**: Si no puedes cambiar configuración del sistema
- **Portable**: Rápido para testing, pero no crea NSIS installer

## Después de Habilitar Developer Mode

Una vez habilitado el Modo de desarrollador, simplemente ejecuta:

```powershell
cd "c:\FreeLancer\super-coldy-pos\La_-gran_michoacana\La_-gran_michoacana"
npm run build:win
```

El instalador se creará en `release/` con el nombre:
- `La Gran Michoacana Setup 1.0.0.exe` (NSIS installer)
- `latest.yml` (metadata para auto-updates)

## Notas

- El modo de desarrollador NO reduce la seguridad de Windows
- Es una configuración estándar para desarrolladores
- No afecta el funcionamiento del instalador final
