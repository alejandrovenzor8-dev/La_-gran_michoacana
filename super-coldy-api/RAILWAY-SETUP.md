# 🚂 Guía de Deploy en Railway

Esta guía te ayudará a desplegar la API de Super Coldy en Railway.

## Requisitos Previos

- Cuenta en [Railway.app](https://railway.app)
- Repositorio en GitHub con el código del proyecto
- PostgreSQL database (Railway puede proporcionar una)

## Pasos para Deploy

### 1. Crear Variable de Entorno BASE_URL (Importante)

Railway necesita que configure las variables de entorno en el panel. El servidor busca automáticamente:
- Las variables están en la sección "Variables" del proyecto

### 2. Variables de Entorno Requeridas

Configura estas variables en Railway:

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `PORT` | `8080` | Puerto donde corre el servidor (Railway lo proporciona típicamente como 3000-8000) |
| `NODE_ENV` | `production` | Ambiente de ejecución |
| `DATABASE_URL` | `postgresql://...` | URL de conexión a PostgreSQL (Railway lo proporciona automáticamente si linkeas PostgreSQL) |
| `JWT_SECRET` | `una-cadena-larga-aleatoria` | Secreto para firmar tokens JWT |
| `JWT_EXPIRES_IN` | `24h` | Tiempo de expiración del token |
| `JWT_REFRESH_SECRET` | `otra-cadena-larga-aleatoria` | Secreto para refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Tiempo de expiración del refresh token |

### 3. Generar Secretos Seguros

Para generar secretos seguros, ejecuta en tu terminal:

```bash
# En Linux/macOS
openssl rand -base64 32

# En PowerShell (Windows)
[Convert]::ToBase64String((1..32 | ForEach-Object {[byte](Get-Random -Maximum 256)}))
```

### 4. Vincular PostgreSQL en Railway

1. Ve a tu proyecto en Railway
2. Click en "Add" → "Add Service" → "Postgres"
3. Railway automáticamente inyectará la variable `DATABASE_URL`

### 5. Variables en package.json

El archivo `package.json` está configurado correctamente:

```json
{
  "main": "dist/src/server.js",
  "start": "node dist/src/server.js",
  "build": "tsc"
}
```

- **Script `build`**: Compila TypeScript a JavaScript
- **Script `start`**: Inicia el servidor en producción

Railroad automáticamente:
1. Ejecuta `npm install`
2. Ejecuta `npm run build` 
3. Ejecuta `npm start`

### 6. Verificar Deploy

Una vez deployed, verifica la salud del servidor:

```bash
curl https://tu-app.railway.app/health
```

Respuesta esperada:
```json
{
  "status": "OK",
  "timestamp": "2026-02-10T12:34:56.789Z",
  "uptime": 123.45
}
```

## Notas Importantes

### 🔐 Seguridad

- **NUNCA** expongas secretos en el código
- Los secretos se definen en Railway, no en `.env`
- Cada ambiente (dev, staging, prod) debe tener sus propios secretos
- Rota los secretos periodicamente en producción

### 🗄️ Base de Datos

- Si creas la BD en Railway, usará el usuario/contraseña de Railway automáticamente
- Railway proporciona backups automáticos
- Puedes ver los logs de la DB en Railway

### 🐛 Debugging

Si hay problemas:

1. **Ver logs en Railway**: Panel → Deployments → View logs
2. **Revisar variables de entorno**: Verifica que estén todas configuradas
3. **Check health endpoint**: `curl https://tu-app.railway.app/health`
4. **Check errores de compilación**: El build log mostrará errores de TypeScript

### ⚡ Performance

- Node 18+ está configurado en `package.json`: `"engines": {"node": ">=18.0.0"}`
- ESM (ES Modules) optimiza el tiempo de carga
- Prisma Client prepara consultas en buildtime

### 📝 Prisma en Production

El proyecto usa Prisma 5.22.0 que es compatible con:
- Node 18+
- PostgreSQL
- ESM

Si necesitas ejecutar migraciones:

```bash
# En Railway Terminal (o localmente contra la BD)
npx prisma migrate deploy
npx prisma db seed
```

## Troubleshooting

### Error: "DATABASE_URL not found"

**Solución**: 
- Verifica que la variable `DATABASE_URL` esté en Railway Variables
- Si usas PostgreSQL en Railway, linkéalo al servicio

### Error: "JWT_SECRET not found"

**Solución**:
- Añade la variable `JWT_SECRET` en Railway Variables
- Debe tener mínimo 32 caracteres

### Servidor no inicia

**Solución**:
1. Chequea los logs: View Logs en Railway
2. Verifica que `npm run build` compile sin errores
3. Asegúrate que todas las variables de entorno estén configuradas

### Errores de tipo TypeScript

Si ves errores durante `build`:
- El build fallará y mostrará los errores
- Verifica que todos los archivos `.ts` tengan imports correctos
- Revisa `tsconfig.json` está bien configurado

## Links Útiles

- [Railway Documentation](https://docs.railway.app)
- [Railway Environment Variables](https://docs.railway.app/guides/variables)
- [PostgreSQL on Railway](https://docs.railway.app/databases/postgresql)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Node.js on Railway](https://docs.railway.app/guides/nodejs)

## Próximos Pasos

- [ ] Configurar variables de entorno en Railway
- [ ] Linkear PostgreSQL
- [ ] Deploy inicial
- [ ] Verificar health endpoint
- [ ] Configurar custom domain (opcional)
- [ ] Setup automático de backups (opcional)
