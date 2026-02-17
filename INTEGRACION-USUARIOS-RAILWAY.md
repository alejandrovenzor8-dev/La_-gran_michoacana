# Integración USersPage con Backend Railway

## Descripción
Se ha integrado completamente la página de Usuarios (UsersPage.tsx) con el backend en Railway. Ahora todas las operaciones CRUD (crear, leer, actualizar, eliminar) usuarios se comunican con el API.

## Cambios Realizados

### Backend (super-coldy-api)

#### 1. **auth.service.ts** - Agregada función `deleteUser()`
- Método para eliminar usuarios
- Validación: No permite eliminar el único administrador del sistema
- Registra auditoría en logs

#### 2. **user.controller.ts** - NUEVO
- Controlador CRUD completo para usuarios
- Métodos:
  - `getAllUsers()` - Obtiene lista paginada de usuarios
  - `getUserById()` - Obtiene usuario por ID
  - `updateUser()` - Actualiza datos de usuario
  - `deleteUser()` - Elimina un usuario

#### 3. **user.routes.ts** - NUEVO
Rutas protegidas por autenticación:
- `GET /api/users` - Listar usuarios (con paginación)
- `GET /api/users/:id` - Obtener usuario específico
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

Todos los endpoints requieren token JWT válido en el header `Authorization: Bearer <token>`

#### 4. **routes/index.ts** - Actualizado
Registra las nuevas rutas:
```typescript
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
```

### Frontend (La_-gran_michoacana)

#### 1. **lib/userService.ts** - NUEVO
Servicio HTTP que encapsula la comunicación con los endpoints de usuarios:
- `getUsers()` - Obtiene lista de usuarios
- `getUserById()` - Obtiene usuario por ID
- `createUser()` - Crea nuevo usuario (POST /auth/register)
- `updateUser()` - Actualiza usuario
- `deleteUser()` - Elimina usuario

Maneja automáticamente:
- Headers con token de autenticación
- Errores de API
- Mapeo de tipos de datos

#### 2. **pages/UsersPage.tsx** - Completamente Refactorizado
- **Carga de datos**: useEffect obtiene usuarios al montar el componente
- **Crear usuario**: Usa userService.createUser() con validación
- **Eliminar usuario**: Usa userService.deleteUser() con confirmación
- **Estados nuevos**:
  - `loading` - Mientras se cargan los datos
  - `isSubmitting` - Mientras se crea un usuario
- **Campos agregados en el formulario**:
  - Email (requerido)
  - Nombre completo (opcional)
  - Mayor validación
- **Manejo de errores**: Muestra mensajes de error al usuario
- **Indicadores visuales**: Spinner de carga, botones deshabilitados durante operaciones

#### 3. **tsconfig.json** - Actualizado
- Agregada configuración JSX
- Configurada resolución de rutas con alias `@/`
- Actualizado a configuración moderna con Vite

#### 4. **.env.example** - NUEVO
Plantilla para variables de entorno:
```env
VITE_API_URL=http://localhost:3000/api
```

## Flujo de Comunicación

### Crear Usuario
```
UsersPage.tsx → userService.createUser()
  → apiClient.post('/auth/register', userData)
    → Backend: authController.register()
      → auth.service.register()
        → Guardar en BD Prisma
```

### Listar Usuarios
```
UsersPage.tsx (useEffect) → userService.getUsers()
  → apiClient.get('/users?limit=100&offset=0')
    → Backend: userController.getAllUsers()
      → auth.service.getAllUsers()
        → Consultar BD Prisma
```

### Eliminar Usuario
```
UsersPage.tsx → userService.deleteUser(userId)
  → apiClient.delete('/users/{id}')
    → Backend: userController.deleteUser()
      → auth.service.deleteUser()
        → Eliminar de BD Prisma
```

## Seguridad

- ✅ Todos los endpoints requieren autenticación JWT
- ✅ Token se obtiene automáticamente de localStorage
- ✅ Token se envía en header Authorization
- ✅ Validación de datos en backend y frontend
- ✅ No se pueden eliminar al único administrador

## Configuración para Railway

### Variables de Entorno en Railway

**Backend:**
```
DATABASE_URL=postgresql://...
JWT_SECRET=tu_secreto_jwt
JWT_REFRESH_SECRET=tu_secreto_refresh
NODE_ENV=production
PORT=3000
```

**Frontend:**
```
VITE_API_URL=https://tu-backend-railway-url.railway.app/api
```

## Próximas Características
- Editar usuario (actualmente solo crear y eliminar)
- Cambio de contraseña
- Gestión de permisos por rol
- Exportación de datos

## Testing
Para probar localmente:
```bash
# Backend en localhost:3000
npm run dev  # en super-coldy-api

# Frontend en localhost:5173
npm run dev  # en La_-gran_michoacana

# Usar credenciales de prueba:
# Username: admin
# Password: (la que hayas configurado)
```

## Notas Importantes
1. El email es requerido (agregado al flujo de registro)
2. Los roles se normalizan automáticamente a minúsculas
3. La paginación usa limit=100 por defecto para mostrar todos los usuarios
4. Los timestamps se convierten correctamente a fecha local
