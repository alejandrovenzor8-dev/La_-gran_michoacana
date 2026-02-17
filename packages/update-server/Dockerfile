# Servidor de Actualizaciones - Super Coldy POS
# Archivo Dockerfile para desplegar en Railway

FROM nginx:alpine

# Copiar archivos de actualización desde la carpeta releases
COPY releases/ /usr/share/nginx/html/

# Configurar NGINX con CORS habilitado
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    \
    # Habilitar listado de directorios \
    autoindex on; \
    autoindex_exact_size off; \
    autoindex_localtime on; \
    \
    # Configuración CORS \
    location / { \
        add_header Access-Control-Allow-Origin * always; \
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always; \
        add_header Access-Control-Allow-Headers "Content-Type" always; \
        \
        # Caché para instaladores \
        expires 1h; \
        add_header Cache-Control "public"; \
    } \
    \
    # Sin caché para latest.yml (siempre obtener última versión) \
    location = /latest.yml { \
        add_header Access-Control-Allow-Origin * always; \
        add_header Cache-Control "no-cache, no-store, must-revalidate"; \
        expires 0; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
