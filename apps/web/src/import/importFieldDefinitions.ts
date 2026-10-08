/**
 * Un champ UGE pouvant être renseigné par import. La liste des champs est
 * la source de vérité du mapping : un fichier importé ne peut qu'associer
 * ses colonnes à des champs déjà listés ici — jamais l'inverse. N'ajoute un
 * champ ici que s'il existe réellement dans le modèle de données actuel.
 */
export interface ImportFieldDefinition {
  key: string;
  label: string;
  description?: string;
  required: boolean;
}

/**
 * Produit (apps/api Prisma `Product`) : name, sku, purchasePrice, salePrice,
 * stockQuantity (via initialStock à la création), minStock, maxStock.
 * Pas de catégorie ni de fournisseur : ces champs n'existent pas sur
 * `Product` dans le schéma actuel.
 */
export const PRODUCT_IMPORT_FIELDS: ImportFieldDefinition[] = [
  { key: 'name', label: 'Désignation du produit', required: true },
  {
    key: 'sku',
    label: 'Référence (SKU)',
    description: 'Identifiant unique du produit dans UGE.',
    required: true,
  },
  { key: 'purchasePrice', label: "Prix d'achat", required: true },
  { key: 'salePrice', label: 'Prix de vente', required: true },
  {
    key: 'initialStock',
    label: 'Stock initial',
    description: '0 si laissé vide.',
    required: false,
  },
  {
    key: 'minStock',
    label: 'Seuil minimum',
    description: 'Déclenche une alerte de rupture.',
    required: false,
  },
  { key: 'maxStock', label: 'Seuil maximum', required: false },
];
