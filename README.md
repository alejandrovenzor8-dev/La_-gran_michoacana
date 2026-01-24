# Super Coldy POS 🍦

Sistema de Punto de Venta moderno para paleterías y heladerías.

## 🚀 Stack Tecnológico

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Build tool ultrarrápido
- **Zustand** - State management
- **TanStack Query** - Data fetching y cache
- **React Router v6** - Routing
- **shadcn/ui** + **TailwindCSS** - UI Components
- **React Hook Form** + **Zod** - Validación de formularios
- **Recharts** - Gráficos y reportes

### Backend
- **Node.js** + **Express** + **TypeScript**
- **PostgreSQL** - Base de datos
- **Prisma** - ORM
- **JWT** - Autenticación
- **Socket.io** - Real-time updates

## 📁 Estructura del Proyecto

```
super-coldy-pos/
├── apps/
│   ├── frontend/          # Aplicación React
│   └── backend/           # API Express
├── packages/
│   ├── shared-types/      # Tipos TypeScript compartidos
│   └── database/          # Prisma schema
├── docker-compose.yml
└── package.json
```

## 🛠️ Setup Inicial

### Prerequisitos
- Node.js >= 18
- pnpm >= 8
- Docker y Docker Compose (opcional para DB local)

### Instalación

```bash
# Instalar dependencias
pnpm install

# Setup base de datos (PostgreSQL con Docker)
docker-compose up -d

# Migrar base de datos
cd packages/database
pnpm prisma migrate dev

# Iniciar desarrollo
pnpm dev:all
```

## 🎯 Scripts Disponibles

```bash
# Frontend (http://localhost:5173)
pnpm dev

# Backend (http://localhost:3000)
pnpm dev:backend

# Ambos simultáneamente
pnpm dev:all

# Build para producción
pnpm build

# Linting
pnpm lint

# Type checking
pnpm type-check

# Formatear código
pnpm format
```

## 📱 Características Principales

### ✅ Fase 1: Core POS
- [x] Login y autenticación
- [x] Dashboard con métricas
- [x] Punto de venta táctil
- [x] Carrito de compras
- [x] Múltiples métodos de pago
- [x] Impresión de tickets
- [x] Gestión de productos

### 🚧 Fase 2: Inventario
- [ ] Control de stock en tiempo real
- [ ] Alertas de inventario bajo
- [ ] Gestión de categorías
- [ ] Sistema de toppings y modificadores

### 🚧 Fase 3: Reportes
- [ ] Ventas diarias/semanales/mensuales
- [ ] Productos más vendidos
- [ ] Corte de caja
- [ ] Análisis de rentabilidad

### 🚧 Fase 4: Avanzado
- [ ] Multi-sucursal
- [ ] Programa de lealtad
- [ ] Facturación electrónica (SAT)
- [ ] App móvil (React Native)
- [ ] Modo offline (PWA)

## 🔐 Usuarios por Defecto

```
Admin:
- Usuario: admin@supercoldy.com
- Contraseña: Admin123!

Cajero:
- Usuario: cajero@supercoldy.com
- Contraseña: Cajero123!
```

## 🐳 Docker

```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Reset completo (cuidado: borra datos)
docker-compose down -v
```

## 📚 Documentación

- [Guía de Desarrollo](./docs/development.md)
- [Arquitectura](./docs/architecture.md)
- [API Reference](./docs/api.md)
- [Deployment](./docs/deployment.md)

## 🤝 Contribución

Este es un proyecto privado para Super Coldy.

## 📄 Licencia

Propietario - Super Coldy © 2026
