# Instalador de La Gran Michoacana POS

Este directorio contiene los herramientas necesarias para instalar La Gran Michoacana POS en tu sistema.

## 🚀 Instalación Rápida

### Opción 1: Instalador Automático (Recomendado)

**Para Windows:**
1. Descarga el archivo `install.bat` desde esta carpeta
2. Haz doble clic en `install.bat`
3. El script detectará automáticamente tu sistema (32 o 64 bits)
4. Elige la versión que deseas instalar
5. Sigue el instalador normalmente

### Opción 2: Instalador Directo

Si prefieres instalar directamente:

**Para sistemas de 32 bits:**
- Ejecuta: `La-Gran-Michoacana-Setup-X.X.X-ia32.exe`

**Para sistemas de 64 bits (Recomendado):**
- Ejecuta: `La-Gran-Michoacana-Setup-X.X.X-x64.exe`

## 🖥️ ¿Qué arquitectura tengo?

### Detectar automáticamente:
1. Presiona `Win+Pause`
2. Mira en "Sistema" → "Tipo de sistema"
3. Verás "32 bits" o "64 bits"

### O usando PowerShell:
```powershell
[Environment]::Is64BitOperatingSystem
```
- Si dice `True`: tienes 64 bits
- Si dice `False`: tienes 32 bits

## 📋 Requisitos Mínimos

- **Windows XP** o superior
- **32 bits** o **64 bits**
- Al menos **500 MB** de espacio en disco
- Conexión a Internet (para actualizaciones automáticas)

## ⚙️ Componentes Incluidos

- ✅ Punto de Venta (POS) con interfaz intuitiva
- ✅ Soporte para doble pantalla (cliente display)
- ✅ Gestión de inventario
- ✅ Reportes de ventas
- ✅ Gestión de usuarios
- ✅ Control de caja registradora
- ✅ Actualizaciones automáticas

## 🔧 Instalación Avanzada

### Script PowerShell (Usuarios Avanzados)

```powershell
.\install.ps1 -Architecture x64   # 64 bits
.\install.ps1 -Architecture ia32  # 32 bits
.\install.ps1 -Architecture auto  # Autodetectar
```

## 📞 Solución de Problemas

### El instalador no se ejecuta
- Asegúrate de descargar todos los archivos necesarios
- Verifica que tienes permisos de administrador
- Desactiva temporalmente el antivirus (algunos bloquean instaladores)

### El programa no inicia
- Intenta instalar la versión para tu arquitectura correcta
- Desinstala y reinstala
- Contacta al soporte técnico

### ¿Necesito 32 o 64 bits?
- **64 bits**: Mejor rendimiento en sistemas modernos (recomendado)
- **32 bits**: Compatible con sistemas más antiguos
- Si tienes 64 bits, elige esa versión

## 📦 Versión

**La Gran Michoacana POS v1.1.8+**

- Desarrollado con: Electron, React, TypeScript
- Backend: Node.js + PostgreSQL
- Actualizado: 2026-02-27

## 📄 Licencia

MIT - La Gran Michoacana © 2026

## 💬 Preguntas y Soporte

Contacta al equipo de TI para:
- Problemas de instalación
- Configuración inicial
- Soporte técnico
- Reportar errores

---

**Nota:** Los instaladores incluyen soporte automático para futuras actualizaciones.
