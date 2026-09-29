FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
# --no-audit evita una llamada de red (chequeo de vulnerabilidades) que en
# algunos entornos Docker se queda colgada indefinidamente sin devolver
# respuesta; npm ci usa el lockfile para una instalación determinista.
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.29-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
# wget viene con nginx:alpine (busybox). 127.0.0.1 explícito, no "localhost":
# /etc/hosts resuelve localhost también a ::1, y nginx.conf solo escucha en
# IPv4 ("listen 80;", sin "listen [::]:80;") — con "localhost" wget probaba
# ::1 primero y el healthcheck fallaba con "Connection refused" siempre.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -q --spider http://127.0.0.1/ || exit 1
