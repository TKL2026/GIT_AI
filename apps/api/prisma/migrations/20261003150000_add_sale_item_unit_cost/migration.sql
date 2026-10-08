-- BUG-006 : fige le coût d'achat au moment de la vente sur chaque SaleItem,
-- pour que le COGS d'une vente déjà conclue ne soit plus jamais recalculé
-- via le Product.purchasePrice courant lors d'une réception ultérieure à
-- un prix différent. Migration additive en 3 étapes (ADD nullable -> backfill
-- -> SET NOT NULL), aucune suppression, aucune perte de données.

-- 1) Ajout de la colonne, nullable le temps du backfill.
ALTER TABLE "sale_items" ADD COLUMN "unitCost" DECIMAL(12,2);

-- 2) Backfill en meilleur effort : le coût exact au moment de chaque vente
-- passée n'a jamais été capturé et ne peut pas être reconstitué ; on utilise
-- donc le dernier Product.purchasePrice connu comme estimation historique.
-- Cette estimation ne bougera plus après cette migration (c'est précisément
-- ce qui corrige le bug).
UPDATE "sale_items" si
SET "unitCost" = p."purchasePrice"
FROM "products" p
WHERE si."productId" = p."id";

-- 3) Rendre la colonne obligatoire pour toutes les ventes futures.
ALTER TABLE "sale_items" ALTER COLUMN "unitCost" SET NOT NULL;
