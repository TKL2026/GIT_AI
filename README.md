# Copilote IA Business

Plateforme SaaS pour PME africaines : ERP opérationnel (produits, stock, achats,
ventes, finances) + copilote IA. Ce dépôt contient le **scaffold technique
initial** : authentification, multi-tenant, base de données, Docker,
documentation API et tests. Les modules métier complets et les agents IA seront
construits dans des passes ultérieures sur cette fondation.

## Stack

- Backend : NestJS (TypeScript), Prisma, PostgreSQL, JWT (access + refresh)
- Frontend : React + Vite (TypeScript)
- Monorepo : npm workspaces (`apps/api`, `apps/web`, `packages/shared`)
- Multi-tenant : base partagée, isolation par `organizationId`

## Démarrage rapide (Docker)

```bash
cp .env.example .env
# éditer .env et définir JWT_ACCESS_SECRET / JWT_REFRESH_SECRET (16+ caractères)

docker compose up --build
```

- API : http://localhost:3000/api (docs Swagger : http://localhost:3000/api/docs)
- Web : http://localhost:5173

Appliquer les migrations Prisma (première fois, dans un autre terminal) :

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npm run prisma:seed   # crée owner@demo.com / Password123!
```

## Démarrage en local (sans Docker)

Prérequis : Node.js 20+, une instance PostgreSQL accessible.

```bash
npm install

cp apps/api/.env.example apps/api/.env
# éditer apps/api/.env (DATABASE_URL, secrets JWT)
cp apps/web/.env.example apps/web/.env

npm run prisma:migrate --workspace apps/api
npm run dev:api    # démarre l'API sur :3000
npm run dev:web    # démarre le frontend sur :5173 (autre terminal)
```

## Tests

```bash
npm run test:api        # tests unitaires backend (Jest)
npm run test:e2e:api     # tests e2e backend (nécessite une base PostgreSQL démarrée)
npm run test:web        # tests frontend (Vitest)
```

## Structure

```
apps/api        NestJS : auth, users, organizations, products (module exemple), health
apps/web        React : login, dashboard placeholder, client API avec JWT
packages/shared Types partagés (DTOs, enum Role) entre backend et frontend
```

Voir `apps/api/prisma/schema.prisma` pour le modèle de données et
`apps/api/src/modules/products` comme référence pour ajouter un nouveau module
métier (stock, achats, ventes, finance...).
