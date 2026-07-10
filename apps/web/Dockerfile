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
RUN npm run build

# Production stage: static files served by nginx
FROM nginx:alpine AS production
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
