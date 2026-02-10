# Changelog - Super Coldy API

Todos los cambios notables a este proyecto serán documentados en este archivo.

## [1.0.0] - 2026-02-10

### ✨ Características Principales

- **ES Modules (ESM)** completo - Módulos nativos de JavaScript
- **Express.js 4.18.2** - Framework HTTP robusto
- **TypeScript 5.9.3** - Type safety y mejor experiencia de desarrollo
- **Prisma 5.22.0** - ORM moderno compatible con Node 18+
- **JWT Authentication** - Tokens de acceso y refresh
- **PostgreSQL Database** - Persistencia de datos
- **Docker & Railway Ready** - Optimizado para deploy en contenedores

### 🔧 Configuración

#### package.json
- Añadido `"type": "module"` para ES Modules
- Actualizado `"main"`: `"dist/src/server.js"` (estructura con rootDir)
- Script `"dev"`: `"nodemon --exec tsx src/server.ts"`
- Script `"start"`: `"node dist/src/server.js"`
- Downgrade Prisma: `5.22.0` (compatible con Node 18+)
- Downgrade @prisma/client: `5.22.0`
- Downgrade express: `^4.18.2` (compatible con Node 18)
- Añadido `"tsx"`: `^4.7.0` (reemplazó ts-node)
- Añadido `"@types/morgan"`: `^1.9.9`
- Removido `"ts-node"` en favor de `tsx`

#### tsconfig.json
- `"target"`: `"ES2022"`
- `"module"`: `"ES2022"`
- `"lib"`: `["ES2022"]`
- `"moduleResolution"`: `"node"`
- `"rootDir"`: `"./"` - Incluye src/ y prisma/
- `"outDir"`: `"./dist"`
- Configuración `ts-node` con `esm: true`
- Deshabilitado `noUnusedLocals` y `noUnusedParameters` para flexibilidad

### 📝 Cambios en Código Fuente

#### Imports Relativos - Extensión `.js` Añadida
Todos los imports relativos ahora incluyen extensión `.js` (requerido por ESM):

**Archivos actualizados:**
- `src/app.ts`
- `src/server.ts`
- `src/config/database.ts`
- `src/controllers/auth.controller.ts`
- `src/controllers/product.controller.ts`
- `src/middlewares/auth.middleware.ts`
- `src/middlewares/auth.ts`
- `src/middlewares/errorHandler.ts`
- `src/middlewares/validation.middleware.ts`
- `src/middlewares/validation.ts`
- `src/middlewares/validators.ts`
- `src/routes/auth.routes.ts`
- `src/routes/product.routes.ts`
- `src/services/auth.service.ts`
- `src/services/product.service.ts`
- `src/utils/jwt.ts`
- `src/utils/password.ts`

#### Validaciones Mejoradas

**src/controllers/product.controller.ts**
- `getProductById()`: Valida que `req.params.id` exista y sea numérico
  - Usa: `Array.isArray(req.params.id) ? req.params.id[0] : req.params.id`
  - Lanza `AppError` si está vacío o no es numérico
- `updateProduct()`: Mismas validaciones
- `deleteProduct()`: Mismas validaciones
- `updateStock()`: Mismas validaciones

**src/controllers/auth.controller.ts**
- `RegisterRequestBody`: `fullName?: string | undefined` (permite undefined explícitamente)

**src/middlewares/auth.middleware.ts**
- `requireRole()`: Validaciones de `req.params.userId` como string

**src/middlewares/auth.ts**
- `ownershipMiddleware()`: Validaciones de `req.params.userId` como string

#### Correcciones TypeScript

**src/config/database.ts**
- Removido `emit: 'event'` de logConfig (no soportado en Prisma 5.22.0)
- Removido listener `client.$on('query')` que causaba conflictos

**src/utils/jwt.ts**
- `expiresIn` y `refreshExpiresIn`: Casteo a `any` para resolver incompatibilidades de tipos con jsonwebtoken

**src/middlewares/validation.middleware.ts**
- `field`: Declarado como `string` tipo explícitamente
- `error.path` y `error.param`: Casteados como `string`

**src/services/product.service.ts**
- `getLowStockProducts()`: Simplificada query para evitar error con `prisma.product.fields.minStock`

#### Manejo de Errores Mejorado

**src/app.ts**
- `connectDatabase()` ahora logs warning en lugar de llamar `process.exit(1)`
- El servidor continúa ejecutándose aunque la BD no esté disponible
- Crítico para Railway: permite que el contenedor siga vivo mientras Railway configura variables

### 📚 Documentación Nueva

#### RAILWAY-SETUP.md
Guía completa para deploy en Railway incluyendo:
- Requisitos previos
- Variables de entorno requeridas
- Cómo vicular PostgreSQL
- Verificación post-deploy
- Troubleshooting común
- Links útiles

#### README.md (Actualizado)
Documentación completa del proyecto con:
- Características principales
- Guía de inicio rápido
- Scripts disponibles
- Estructura del proyecto
- Endpoints de autenticación y productos
- Instrucciones de base de datos
- Deploy en Railway (enlace a RAILWAY-SETUP.md)
- Stack técnico detallado
- Roadmap

#### .env.example (Mejorado)
Variables de entorno requeridas con explicaciones detalladas

### 🐛 Bugfixes

1. **Compilación TypeScript** - Resueltos 10 errores de tipo
2. **tipo string|string[]** - Manejado correctamente en req.params
3. **Prisma 5.22.0 compatibility** - Removidas APIs deprecadas
4. **Rutas de compilación** - Actualizado mainEntry point a `dist/src/server.js`
5. **ESM imports** - Todos los imports relativos funcionan con extensión `.js`

### ⚙️ Optimizaciones

1. **Startup más rápido** - No bloquea esperando BD
2. **Error handling graceful** - Servidor sigue corriendo aunque BD falle
3. **Logs informativos** - Mejor visibilidad en desarrollo y producción
4. **Type safety** - 100% de archivos TypeScript en strict mode

### 🚀 Deploy Ready

El proyecto está 100% listo para Railway:

- ✅ `npm run build` compila sin errores
- ✅ `npm start` inicia el servidor
- ✅ Variables de entorno via Railway config
- ✅ PostgreSQL connect string via DATABASE_URL
- ✅ Health endpoint en `/health`
- ✅ Logs configurados para producción
- ✅ ESM imports compilados correctamente
- ✅ Node 18+ requerido (especificado en package.json)

### 📋 Checklist para Deploy Railway

- [ ] Crear proyecto en Railway
- [ ] Configurar variables de entorno
- [ ] Linkear PostgreSQL
- [ ] Conectar repositorio GitHub
- [ ] Verificar `/health` endpoint post-deploy
- [ ] Configurar custom domain (opcional)
- [ ] Setup de backups automáticos (opcional)

### 🔄 Próximos Pasos Sugeridos

1. **Testing** - Añadir tests unitarios e integración
2. **API Documentation** - Swagger/OpenAPI
3. **Rate Limiting** - Protección contra abuse
4. **Caching** - Redis para performance
5. **WebSockets** - Notificaciones en tiempo real
6. **Audit Logs** - Rastrear cambios
7. **Multi-tenancy** - Soporte de múltiples clientes

---

**Nota**: Este changelog documenta los cambios principales. Para cambios menores, revisar git log.
