# 🎨 VISTA PREVIA DEL SISTEMA

## 📊 Arquitectura del Proyecto

```
Super Coldy POS (Electron App)
│
├─── Proceso Principal (main.ts)
│    ├─ Ventana 1: Cajero (POSPage)
│    └─ Ventana 2: Cliente (CustomerDisplayPage)
│
└─── Comunicación IPC
     └─ Sincronización en Tiempo Real
```

---

## 🖥️ Pantalla del Cajero (POSPage)

```
┌────────────────────────────────────────────────────────────┐
│  🍦 Super Coldy POS                              [Carrito] │
│  Selecciona los productos para agregar al carrito          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                  │
│  │  🍓  │  │  🥭  │  │  🍋  │  │  🍦  │                  │
│  │Paleta│  │Paleta│  │Paleta│  │Helado│                  │
│  │Fresa │  │Mango │  │Limón │  │Vainil│                  │
│  │$15.00│  │$15.00│  │$15.00│  │$25.00│                  │
│  └──────┘  └──────┘  └──────┘  └──────┘                  │
│                                                             │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                  │
│  │  🍫  │  │  🍨  │  │  🧊  │  │  🥤  │                  │
│  │Helado│  │Napoli│  │Raspad│  │ Agua │                  │
│  │Choco │  │ tano │  │  o   │  │Fresca│                  │
│  │$25.00│  │$30.00│  │$20.00│  │$18.00│                  │
│  └──────┘  └──────┘  └──────┘  └──────┘                  │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Panel del Carrito (Lateral Derecho)

```
┌─────────────────────────┐
│ 🛒 Carrito              │
│ 3 productos             │
├─────────────────────────┤
│                         │
│ ┌─────────────────────┐ │
│ │ 🍓 Paleta de Fresa │ │
│ │ $15.00             │ │
│ │ [−] 2 [+]  $30.00  │ │
│ │                 🗑️  │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ 🍦 Helado Vainilla │ │
│ │ $25.00             │ │
│ │ [−] 1 [+]  $25.00  │ │
│ │                 🗑️  │ │
│ └─────────────────────┘ │
│                         │
├─────────────────────────┤
│ Total:        $55.00    │
├─────────────────────────┤
│ [  Procesar Pago  ]     │
│ [  Limpiar Carrito ]    │
└─────────────────────────┘
```

---

## 🎬 Pantalla del Cliente (CustomerDisplayPage)

### Modo: Carrito Vacío (Publicidad)

```
┌──────────────────────────────────────────────────────────┐
│  🍦 Super Coldy                     Miércoles, 29 enero  │
│  Las mejores paletas y helados              14:30        │
├──────────────────────────────────────────────────────────┤
│                                                           │
│                                                           │
│                        🍓                                 │
│                                                           │
│              Paletas de Fruta Natural                     │
│                                                           │
│                                                           │
│         ✨ Ingredientes de Primera Calidad                │
│         💯 100% Sabor Natural                            │
│         😊 Tu Satisfacción es Nuestra Prioridad          │
│                                                           │
│              ¡Bienvenido a Super Coldy!                   │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Modo: Con Productos

```
┌──────────────────────────────────────────────────────────┐
│  🍦 Super Coldy                     Miércoles, 29 enero  │
│  Las mejores paletas y helados              14:30        │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ╔═══════════════════════════════════════════════════╗   │
│  ║  Tu Compra                                        ║   │
│  ║───────────────────────────────────────────────────║   │
│  ║                                                   ║   │
│  ║  ┌────┐                                           ║   │
│  ║  │ 🍓 │  Paleta de Fresa                          ║   │
│  ║  └────┘  $15.00 × 2                     $30.00    ║   │
│  ║                                                   ║   │
│  ║  ┌────┐                                           ║   │
│  ║  │ 🍦 │  Helado de Vainilla                       ║   │
│  ║  └────┘  $25.00 × 1                     $25.00    ║   │
│  ║                                                   ║   │
│  ╚═══════════════════════════════════════════════════╝   │
│                                                           │
│  ╔═══════════════════════════════════════════════════╗   │
│  ║  💰 TOTAL                            $55.00       ║   │
│  ╚═══════════════════════════════════════════════════╝   │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 Flujo de Trabajo

```
1. Cajero selecciona producto
   ↓
2. Se agrega al carrito (ventana cajero)
   ↓
3. IPC envía actualización
   ↓
4. Pantalla cliente se actualiza instantáneamente
   ↓
5. Cliente ve el producto con animación
```

---

## 🎨 Paleta de Colores

- **Primary**: Púrpura vibrante (#8b5cf6)
- **Background**: Gradiente azul → púrpura → rosa
- **Cards**: Blanco con sombras suaves
- **Text**: Gris oscuro (#1f2937)
- **Success**: Verde (#10b981)

---

## ✨ Animaciones Incluidas

- ✅ Productos aparecen con fade-in
- ✅ Total cambia con efecto de escala
- ✅ Transición suave entre publicidad y carrito
- ✅ Hover effects en productos
- ✅ Animación de carrusel en anuncios

---

## 📱 Responsive

- ✅ Se adapta a diferentes resoluciones
- ✅ Funciona en pantallas 1080p y 4K
- ✅ Grid responsivo de productos
- ✅ Fuentes escalables

---

**Diseñado para una experiencia visual impecable** 🎨✨
