# 🍦 Super Coldy API

Backend API REST para el Sistema POS de Super Coldy. Construido con Express.js, TypeScript y Prisma.

## ✨ Características

- ✅ **Express.js 4.18.2** - Framework HTTP robusto
- ✅ **TypeScript 5.9.3** - Type safety y mejor DX
- ✅ **Prisma 5.22.0** - ORM moderno para PostgreSQL
- ✅ **JWT Authentication** - Tokens de acceso y refresh
- ✅ **ES Modules (ESM)** - Módulos nativos de JavaScript
- ✅ **Docker Ready** - Compatible con Railway y otros contenedores
- ✅ **Health Checks** - Endpoint `/health` para monitoreo

## 🚀 Inicio Rápido

### Requisitos

- **Node.js 18+**
- **PostgreSQL 12+**
- **npm o yarn**

### Instalación

1. **Clonar repositorio**

```bash
git clone https://github.com/tu-usuario/super-coldy-pos.git
cd super-coldy-api
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

```bash
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar .env.local con tus datos
# Mínimo necesario:
# - DATABASE_URL: conexión a PostgreSQL
# - JWT_SECRET: secreto para tokens
# - JWT_REFRESH_SECRET: secreto para refresh tokens
```

4. **Configurar Prisma**

```bash
# Ejecutar migraciones
npx prisma migrate deploy

# Opcional: Seed de datos iniciales
npx prisma db seed
```

5. **Compilar TypeScript**

```bash
npm run build
```

6. **Iniciar servidor**

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:8080` (o el puerto configurado)

## 📦 Scripts Disponibles

```bash
npm run dev              # Desarrollo con nodemon + tsx
npm run build            # Compilar TypeScript a JavaScript
npm start                # Iniciar servidor compilado
npm run prisma:generate  # Regenerar Prisma Client
npm run prisma:migrate   # Crear nueva migración
npm run prisma:studio    # Abrir Prisma Studio (UI para BD)
npm run prisma:seed      # Ejecutar seed scripts
```

## 🏗️ Estructura del Proyecto

```
super-coldy-api/
├── src/
│   ├── app.ts                      # Configuración de Express
│   ├── server.ts                   # Entry point
│   ├── config/
│   │   ├── database.ts             # Conexión Prisma
│   │   └── jwt.ts                  # Configuración JWT
│   ├── controllers/                # Lógica de rutas
│   │   ├── auth.controller.ts
│   │   └── product.controller.ts
│   ├── services/                   # Lógica de negocio
│   │   ├── auth.service.ts
│   │   └── product.service.ts
│   ├── middlewares/                # Middlewares Express
│   │   ├── auth.middleware.ts
│   │   ├── errorHandler.ts
│   │   └── validation.middleware.ts
│   ├── routes/                     # Definición de rutas
│   │   ├── auth.routes.ts
│   │   └── product.routes.ts
│   ├── utils/                      # Utilitarios
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── logger.ts
│   └── types/                      # Tipos TypeScript
├── prisma/
│   ├── schema.prisma               # Esquema de base de datos
│   └── seed.ts                     # Scripts de seed
├── dist/                           # Compilado (gitignored)
├── .env.example                    # Ejemplo de variables
├── package.json
├── tsconfig.json
├── RAILWAY-SETUP.md                # Guía para Railway
└── README.md                       # Este archivo
```

## 🔐 Autenticación

### Endpoints de Auth

- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Login y obtener tokens
- `POST /api/auth/refresh-token` - Refrescar access token
- `GET /api/auth/me` - Obtener perfil del usuario autenticado
- `POST /api/auth/change-password` - Cambiar contraseña
- `POST /api/auth/logout` - Logout

### Flujo de Autenticación

1. Usuario se registra o loguea
2. Servidor retorna `accessToken` (24h) y `refreshToken` (7d)
3. Cliente incluye `accessToken` en header: `Authorization: Bearer <token>`
4. Cuando `accessToken` expira, usar `refreshToken` para obtener uno nuevo
5. Si `refreshToken` expira, user debe loguear de nuevo

### Roles Soportados

- `ADMIN` - Acceso total (usuario/producto/permisos)
- `GERENTE` - Acceso a reportes y configuración
- `CAJERO` - Acceso a operaciones de punto de venta

## 🛒 Productos

### Endpoints de Productos

- `POST /api/products` - Crear producto (ADMIN/GERENTE)
- `GET /api/products` - Listar productos (con paginación)
- `GET /api/products/:id` - Obtener un producto
- `PUT /api/products/:id` - Actualizar producto (ADMIN/GERENTE)
- `DELETE /api/products/:id` - Desactivar producto (ADMIN/GERENTE)
- `GET /api/products/categories` - Listar categorías
- `GET /api/products/low-stock` - Productos con stock bajo
- `POST /api/products/:id/update-stock` - Ajustar stock

### Filtros Disponibles

```bash
# Listar activos
GET /api/products?active=true

# Por categoría
GET /api/products?category=helados

# Stock bajo
GET /api/products?minStock=true

# Paginación
GET /api/products?page=2&limit=50
```

## 🗄️ Base de Datos

### Modelos Principales

- **User** - Usuarios del sistema
- **Product** - Catálogo de productos
- **Sale** - Transacciones de venta
- **StockMovement** - Historial de movimientos de stock
- **Permissions** - Control de acceso

### Migraciones

```bash
# Ver estado de migraciones
npx prisma migrate status

# Crear nueva migración
npx prisma migrate dev --name mi_migración

# Aplicar migraciones pendientes
npx prisma migrate deploy

# Resetear BD (SOLO desarrollo)
npx prisma migrate reset
```

## 🐳 Docker & Railway

Este proyecto está optimizado para Railway:

- ✅ Node.js 18+ (especificado en `package.json`)
- ✅ Build script configurado (`npm run build`)
- ✅ Start script configurado (`npm start`)
- ✅ ESM soportado en runtime
- ✅ Variables de entorno bien manejadas

### Deploy en Railway

Ver [RAILWAY-SETUP.md](./RAILWAY-SETUP.md) para instrucciones detalladas.

TL;DR:
1. Crea proyecto en Railway
2. Conecta tu repositorio GitHub
3. Configura variables de entorno
4. Linkea PostgreSQL
5. Deploy automático en cada push

## 🛠️ Development

### TypeScript

El proyecto usa TypeScript 5.9.3 en `strict` mode:

```bash
# Compilar
npm run build

# Ver errores
npm run build --verbose
```

### Prisma Studio

Interface gráfica para manejar la BD:

```bash
npm run prisma:studio
```

Visit `http://localhost:5555`

### Logging

El proyecto usa un logger personalizado con niveles:
- `debug` - Solo en development
- `info` - Información general
- `warn` - Advertencias
- `error` - Errores

```typescript
import { logger } from './utils/logger.js';

logger.info('Mensaje informativo', { data: 'opcional' });
logger.error('Error occurred', error);
```

## 🚦 Health Check

Endpoint para verificar que el servidor está corriendo:

```bash
curl http://localhost:8080/health
```

Respuesta:
```json
{
  "status": "OK",
  "timestamp": "2026-02-10T12:00:00.000Z",
  "uptime": 3600.5
}
```

## 🔒 Seguridad

- ✅ **Helmet.js** - Headers de seguridad HTTP
- ✅ **CORS** - Control de origen
- ✅ **Password Hashing** - bcryptjs con 10 rounds
- ✅ **JWT Tokens** - Firmas HMAC-SHA256
- ✅ **Request Validation** - express-validator
- ✅ **Error Handling** - No expone detalles internos

### Mejores Prácticas

1. **Enviar secretos via variables de entorno** (nunca en código)
2. **HTTPS en producción** (Railway lo proporciona)
3. **Rotar secretos periodicamente**
4. **Limitar rate de requests** (próximamente)
5. **Logs de audit para operaciones sensibles**

## 🧪 Testing

Placeholder para tests (próximamente):

```bash
npm run test
npm run test:watch
npm run test:coverage
```

## 📚 Stack Técnico

| Componente | Versión | Propósito |
|-----------|---------|----------|
| Node.js | 18+ | Runtime |
| Express | 4.18.2 | Framework HTTP |
| TypeScript | 5.9.3 | Type Safety |
| Prisma | 5.22.0 | ORM |
| PostgreSQL | 12+ | Base de datos |
| JWT | 9.0.3 | Autenticación |
| bcryptjs | 3.0.3 | Password hashing |
| tsx | 4.7.0 | TS execution |
| Helmet | 8.1.0 | Security headers |
| Morgan | 1.10.1 | HTTP logging |

## 📄 Licencia

MIT

## 👥 Contribuciones

Las contribuciones son bienvenidas. Para cambios mayores:

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre una Pull Request

## 📞 Soporte

Para reportar bugs o solicitar features:
- Abre un issue en GitHub
- Contacta al equipo

## 🎯 Roadmap

- [ ] Tests unitarios e integración
- [ ] Rate limiting
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Caching (Redis)
- [ ] Audit logs
- [ ] Export de reportes (PDF/Excel)
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Multi-tenancy support
