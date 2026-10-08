import type { ImportFieldDefinition } from './importFieldDefinitions';

const ALIASES: Record<string, string[]> = {
  name: ['nom', 'name', 'designation', 'article', 'produit', 'libelle'],
  sku: ['sku', 'reference', 'ref', 'code', 'code produit'],
  purchasePrice: ["prix_achat", 'prixachat', "prix d'achat", 'prix achat', 'purchaseprice', 'cout', 'cout achat'],
  salePrice: ['prix_vente', 'prixvente', 'prix de vente', 'prix vente', 'saleprice'],
  initialStock: ['stock_initial', 'stockinitial', 'stock initial', 'stock', 'quantite', 'initialstock'],
  minStock: ['seuil_min', 'seuil minimum', 'stock_min', 'minstock', 'stock minimum'],
  maxStock: ['seuil_max', 'seuil maximum', 'stock_max', 'maxstock', 'stock maximum'],
};

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Suggestion d'association colonne→champ, affichée comme simple aide dans
 * l'UI (section 13) : elle ne remplace jamais la confirmation manuelle de
 * l'utilisateur, qui reste seul maître du mapping final.
 */
export function suggestColumnMapping(
  headers: string[],
  fields: ImportFieldDefinition[],
): Record<string, number | null> {
  const normalizedHeaders = headers.map(normalize);
  const suggestions: Record<string, number | null> = {};

  for (const field of fields) {
    const aliases = (ALIASES[field.key] ?? []).map(normalize);
    const index = normalizedHeaders.findIndex((h) => aliases.includes(h));
    suggestions[field.key] = index !== -1 ? index : null;
  }

  return suggestions;
}
