# Super Coldy POS - Electron

Sistema de Punto de Venta con doble pantalla para Paletería Super Coldy.

## 🚀 Características

- ✅ **Doble Pantalla** - Pantalla de cajero y pantalla de cliente automáticas
- ✅ **Electron** - Aplicación de escritorio multiplataforma
- ✅ **React 18 + TypeScript** - UI moderna y tipado seguro
- ✅ **TailwindCSS** - Diseño profesional y responsive
- ✅ **Zustand** - Gestión de estado simplificada
- ✅ **IPC Communication** - Sincronización en tiempo real entre ventanas
- ✅ **Framer Motion** - Animaciones fluidas

## 📋 Requisitos Previos

- **Node.js** >= 18.0.0
- **npm** o **pnpm**

## 🔧 Instalación

1. **Descomprimir el proyecto**

2. **Instalar dependencias:**

```bash
npm install
```

## 🎮 Uso

### Modo Desarrollo

```bash
npm run dev
```

Esto abrirá:
- **Ventana Principal** (Cajero) - Interfaz completa del POS
- **Ventana Secundaria** (Cliente) - Pantalla de visualización para el cliente

Si tienes 2 monitores conectados, la ventana del cliente se abrirá automáticamente en el segundo monitor en pantalla completa.

### Build para Producción

```bash
npm run build
```

Esto generará ejecutables en la carpeta `release/`:
- Windows: `.exe`
- macOS: `.dmg`
- Linux: `.AppImage`

## 📁 Estructura del Proyecto

```
super-coldy-electron/
├── electron/
│   ├── main.ts              # Proceso principal de Electron
│   └── preload.ts           # Bridge seguro entre procesos
├── src/
│   ├── pages/
│   │   ├── POSPage.tsx      # Interfaz del cajero
│   │   └── CustomerDisplayPage.tsx  # Pantalla del cliente
│   ├── stores/
│   │   └── cartStore.ts     # Store de Zustand para el carrito
│   ├── components/
│   │   └── ui/              # Componentes reutilizables
│   ├── lib/
│   │   └── utils.ts         # Utilidades
│   ├── App.tsx              # Router principal
│   ├── main.tsx             # Entry point
│   └── index.css            # Estilos globales
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 🎯 Funcionalidades Implementadas

### Pantalla del Cajero (POSPage)
- ✅ Catálogo de productos con categorías
- ✅ Carrito de compras interactivo
- ✅ Agregar/quitar productos
- ✅ Ajustar cantidades
- ✅ Cálculo automático de totales
- ✅ Limpiar carrito
- ✅ Interfaz intuitiva y responsive

### Pantalla del Cliente (CustomerDisplayPage)
- ✅ Visualización en tiempo real del carrito
- ✅ Animaciones fluidas al agregar/quitar productos
- ✅ Publicidad automática cuando el carrito está vacío
- ✅ Display grande de productos y precios
- ✅ Total visible y destacado
- ✅ Diseño atractivo con gradientes

## 🔌 Comunicación IPC

Las dos ventanas se comunican mediante **IPC (Inter-Process Communication)** de Electron:

```typescript
// Cajero → Cliente
window.electronAPI.updateCart(data)

// Cliente ← Cajero
window.electronAPI.onCartUpdated(callback)
```

Esto garantiza sincronización instantánea entre ambas pantallas.

## 🎨 Personalización

### Agregar Productos

Edita `src/pages/POSPage.tsx`:

```typescript
const PRODUCTS = [
  { 
    id: '9', 
    name: 'Nuevo Producto', 
    price: 30, 
    emoji: '🍰', 
    category: 'Postres' 
  },
  // ... más productos
];
```

### Cambiar Colores

Edita `src/index.css`:

```css
:root {
  --primary: 262 83% 58%;  /* Color principal */
  --secondary: 210 40% 96.1%;  /* Color secundario */
}
```

### Personalizar Publicidad

Edita `src/pages/CustomerDisplayPage.tsx`:

```typescript
const ads = [
  { emoji: '🎉', text: 'Nueva Promoción' },
  // ... más anuncios
];
```

## 🖥️ Configuración Multi-Monitor

El sistema detecta automáticamente los monitores conectados:

- **1 Monitor**: Ambas ventanas se abren en posiciones diferentes
- **2+ Monitores**: La pantalla del cliente se abre en pantalla completa en el segundo monitor

## 📦 Scripts Disponibles

```bash
npm run dev              # Desarrollo con hot-reload
npm run build            # Build para producción
npm start                # Ejecutar la aplicación compilada
npm run build:vite       # Solo build de la UI
npm run build:electron   # Solo build de Electron
```

## 🐛 Troubleshooting

### La ventana del cliente no se abre en el segundo monitor

1. Verifica que Windows detecte ambos monitores (Configuración → Pantalla)
2. Asegúrate de que el modo esté en "Extender" no "Duplicar"
3. Reinicia la aplicación

### Error al iniciar en desarrollo

```bash
# Limpiar caché y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Build falla

Asegúrate de tener instalado:
- Node.js >= 18
- Las dependencias de electron-builder para tu SO

## 🚀 Próximas Funcionalidades

- [ ] Sistema de pagos (efectivo, tarjeta, etc.)
- [ ] Impresión de tickets
- [ ] Gestión de inventario
- [ ] Base de datos local (SQLite)
- [ ] Reportes de ventas
- [ ] Usuarios y permisos
- [ ] Integración con impresora fiscal
- [ ] Modo offline completo

## 📄 Licencia

Propietario - Super Coldy © 2026

## 💬 Soporte

Para cualquier duda o problema, contacta al equipo de desarrollo.

---

**¡Disfruta de tu nuevo sistema POS!** 🍦🎉
