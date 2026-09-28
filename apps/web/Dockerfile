# Dev stage: Vite dev server with HMR, used by docker-compose for local development
FROM node:20-alpine AS dev
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install
COPY . .
RUN npm run build --workspace @copilote/shared
WORKDIR /workspace/apps/web
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# Build stage: compiles static assets for production
FROM node:20-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install
COPY . .
RUN npm run build --workspace @copilote/shared
WORKDIR /workspace/apps/web
# Baké dans le bundle statique au moment du build (Vite lit les env vars à la
# compilation, pas à l'exécution) — /api fonctionne car nginx reverse-proxy
# ce chemin vers le conteneur api en production (voir nginx.conf.template).
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_SENTRY_DSN=
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
RUN npm run build

# Production stage: static files served by nginx, reverse-proxying /api
FROM nginx:alpine AS production
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
