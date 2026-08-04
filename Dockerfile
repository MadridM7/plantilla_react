FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# --no-audit evita una llamada de red (chequeo de vulnerabilidades) que en
# algunos entornos Docker se queda colgada indefinidamente sin devolver
# respuesta; npm ci usa el lockfile para una instalación determinista.
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
