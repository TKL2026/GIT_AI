# Dev stage: hot-reload via bind mount, used by docker-compose for local development
FROM node:20-alpine AS dev
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install
COPY . .
RUN npm run build --workspace @copilote/shared
WORKDIR /workspace/apps/api
RUN npx prisma generate
CMD ["npm", "run", "start:dev"]

# Build stage: compiles for production
FROM node:20-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install
COPY . .
RUN npm run build --workspace @copilote/shared
WORKDIR /workspace/apps/api
RUN npx prisma generate
RUN npm run build

# Production stage: minimal runtime image
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /workspace/apps/api/dist ./dist
COPY --from=build /workspace/apps/api/node_modules ./node_modules
COPY --from=build /workspace/apps/api/prisma ./prisma
COPY --from=build /workspace/apps/api/package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/main"]
