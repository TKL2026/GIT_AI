-- BUG-004 : un produit déjà vendu/acheté ne peut pas être supprimé physiquement
-- (SaleItem.product a onDelete: Restrict). On ajoute donc un drapeau d'archivage,
-- même pattern que Plan.isActive déjà existant dans ce schéma.
-- DEFAULT true s'applique aussi aux lignes existantes lors d'un ADD COLUMN NOT NULL
-- en PostgreSQL : aucun backfill séparé n'est nécessaire.
ALTER TABLE "products" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
