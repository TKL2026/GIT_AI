-- AlterTable
ALTER TABLE "organizations" ALTER COLUMN "currency" SET DEFAULT 'XAF';

-- Backfill : les organisations déjà créées sans devise passent aussi à XAF
-- (déploiement Cameroun uniquement, une seule devise réelle).
UPDATE "organizations" SET "currency" = 'XAF' WHERE "currency" IS NULL;
