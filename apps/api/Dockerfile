# Dev stage: hot-reload via bind mount, used by docker-compose for local development
FROM node:20-alpine AS dev
WORKDIR /workspace
# Requis par les moteurs Prisma (client + migrations) : Alpine récent ne
# fournit pas openssl par défaut, ce qui fait échouer Prisma silencieusement.
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/copilot-engine/package.json packages/copilot-engine/package.json
RUN npm install
COPY . .
RUN npm run build --workspace @copilote/shared
RUN npm run build --workspace @copilote/copilot-engine
WORKDIR /workspace/apps/api
RUN npx prisma generate
CMD ["npm", "run", "start:dev"]

# Build stage: compiles for production
FROM node:20-alpine AS build
WORKDIR /workspace
# Requis par les moteurs Prisma (client + migrations) : Alpine récent ne
# fournit pas openssl par défaut, ce qui fait échouer Prisma silencieusement.
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/copilot-engine/package.json packages/copilot-engine/package.json
RUN npm install
COPY . .
RUN npm run build --workspace @copilote/shared
RUN npm run build --workspace @copilote/copilot-engine
WORKDIR /workspace/apps/api
RUN npx prisma generate
RUN npm run build
WORKDIR /workspace
RUN npm prune --omit=dev

# Production stage: minimal runtime image
# Keeps the monorepo's relative layout (workspace/apps/api, workspace/packages/*)
# because node_modules/@copilote/* are symlinks pointing at ../packages/* —
# flattening into /app would leave those symlinks dangling.
FROM node:20-alpine AS production
WORKDIR /workspace
ENV NODE_ENV=production
# Requis par les moteurs Prisma (client + migrations) : Alpine récent ne
# fournit pas openssl par défaut, ce qui fait échouer Prisma silencieusement.
RUN apk add --no-cache openssl
COPY --from=build --chown=node:node /workspace/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/packages/shared/dist ./packages/shared/dist
COPY --from=build --chown=node:node /workspace/packages/shared/package.json ./packages/shared/package.json
COPY --from=build --chown=node:node /workspace/packages/copilot-engine/dist ./packages/copilot-engine/dist
COPY --from=build --chown=node:node /workspace/packages/copilot-engine/package.json ./packages/copilot-engine/package.json
COPY --from=build --chown=node:node /workspace/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /workspace/apps/api/prisma ./apps/api/prisma
COPY --from=build --chown=node:node /workspace/apps/api/package.json ./apps/api/package.json
WORKDIR /workspace/apps/api
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "dist/main"]
