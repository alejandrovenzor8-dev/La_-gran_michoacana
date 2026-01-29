# 🚀 GUÍA DE INICIO RÁPIDO - Super Coldy POS

## ⚡ Instalación en 3 Pasos

### 1️⃣ Instalar Dependencias

Abre la terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
```

⏱️ Esto tomará 2-3 minutos...

---

### 2️⃣ Iniciar en Modo Desarrollo

```bash
npm run dev
```

✨ **¡Se abrirán 2 ventanas automáticamente!**

- **Ventana 1 (Principal)**: Interfaz del Cajero
- **Ventana 2 (Secundaria)**: Pantalla del Cliente

---

### 3️⃣ Probar el Sistema

1. **En la ventana del cajero**, haz clic en cualquier producto
2. **Observa la pantalla del cliente** - verás el producto aparecer instantáneamente
3. **Ajusta cantidades** con los botones + y -
4. **Elimina productos** con el ícono de basura
5. **Limpia el carrito** con el botón "Limpiar Carrito"

---

## 🖥️ Configurar Doble Pantalla

Si tienes 2 monitores físicos:

1. **Conecta ambos monitores** a tu PC
2. **Clic derecho en el escritorio** → "Configuración de pantalla"
3. **Selecciona "Extender estas pantallas"**
4. **Arrastra los monitores** para organizarlos según su posición física
5. **Ejecuta la aplicación** - la pantalla del cliente irá al segundo monitor automáticamente

---

## 📝 Comandos Útiles

```bash
# Modo desarrollo (hot-reload)
npm run dev

# Build para producción
npm run build

# Limpiar y reinstalar
rm -rf node_modules
npm install
```

---

## 🎯 Características Principales

### ✅ Ya Funciona:
- Catálogo de productos
- Carrito de compras
- Sincronización en tiempo real
- Doble pantalla automática
- Animaciones suaves

### 🔜 Por Implementar:
- Sistema de pagos
- Impresión de tickets
- Base de datos
- Reportes

---

## 🐛 ¿Problemas?

### Error: "npm not found"
➡️ Instala Node.js desde: https://nodejs.org/

### La app no inicia
```bash
npm install
npm run dev
```

### Solo se abre una ventana
➡️ Es normal si solo tienes 1 monitor. Para probar doble pantalla, conecta un segundo monitor.

---

## 🎨 Personalización Rápida

### Cambiar Productos

Edita `src/pages/POSPage.tsx` línea 9:

```typescript
const PRODUCTS = [
  { id: '1', name: 'Tu Producto', price: 25, emoji: '🍰', category: 'Nueva' },
  // ...
];
```

### Cambiar Colores

Edita `tailwind.config.js` línea 32:

```javascript
primary: "hsl(262 83% 58%)", // Cambia estos valores
```

---

## 📞 Soporte

¿Necesitas ayuda? Revisa:
- `README.md` - Documentación completa
- `src/` - Código fuente comentado

---

**¡Listo para vender! 🍦💰**
