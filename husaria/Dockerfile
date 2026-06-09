FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY angular.json ./
COPY tsconfig*.json ./
COPY ngsw-config.json ./
COPY src ./src

RUN npm run build

FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.d/40-husaria-runtime-config.sh
COPY --from=build /app/dist/husaria /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.d/40-husaria-runtime-config.sh

EXPOSE 80
