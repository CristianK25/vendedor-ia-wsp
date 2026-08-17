# Fase 1: Build
FROM node:20-alpine AS builder

# Instalar pnpm de forma segura y robusta usando npm global
RUN npm install -g pnpm@10.34.1

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Fase 2: Servidor Web Nginx
FROM nginx:alpine

# Reemplazar configuración por defecto de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos compilados de Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
