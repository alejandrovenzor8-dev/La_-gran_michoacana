# Servidor de Actualizaciones - La Michoacana POS
FROM nginx:alpine
# Build context is git root. Use full relative path to releases/
COPY packages/update-server/releases/ /usr/share/nginx/html/
# Verificar que los archivos se copiaron correctamente
RUN ls -la /usr/share/nginx/html/ && test -f /usr/share/nginx/html/latest.yml && echo "OK: latest.yml presente"
COPY packages/update-server/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
