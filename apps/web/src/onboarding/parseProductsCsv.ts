import Papa from 'papaparse';

export interface ParsedProductRow {
  line: number;
  name: string;
  sku: string;
  purchasePrice: number;
  salePrice: number;
  initialStock: number;
}

export interface ProductsCsvParseError {
  line: number;
  message: string;
}

export interface ProductsCsvParseResult {
  rows: ParsedProductRow[];
  errors: ProductsCsvParseError[];
}

const HEADER_ALIASES: Record<'name' | 'sku' | 'purchasePrice' | 'salePrice' | 'initialStock', string[]> = {
  name: ['nom', 'name'],
  sku: ['sku', 'référence', 'reference'],
  purchasePrice: ['prix_achat', 'prixachat', 'purchaseprice', "prix d'achat"],
  salePrice: ['prix_vente', 'prixvente', 'saleprice', 'prix de vente'],
  initialStock: ['stock_initial', 'stockinitial', 'stock', 'initialstock'],
};

function findColumn(headers: string[], aliases: string[]): string | null {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx !== -1) return headers[idx];
  }
  return null;
}

/**
 * Colonnes attendues (insensibles à la casse, quelques alias tolérés) :
 * nom, sku, prix_achat, prix_vente, stock_initial (optionnelle, 0 par défaut).
 * Pas de mapping de colonnes interactif — un modèle téléchargeable donne le
 * format exact attendu, ce qui couvre le besoin sans UI de mapping complexe.
 */
export function parseProductsCsv(csvText: string): ProductsCsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  const headers = parsed.meta.fields ?? [];

  const columns = {
    name: findColumn(headers, HEADER_ALIASES.name),
    sku: findColumn(headers, HEADER_ALIASES.sku),
    purchasePrice: findColumn(headers, HEADER_ALIASES.purchasePrice),
    salePrice: findColumn(headers, HEADER_ALIASES.salePrice),
    initialStock: findColumn(headers, HEADER_ALIASES.initialStock),
  };

  if (!columns.name || !columns.sku || !columns.purchasePrice || !columns.salePrice) {
    return {
      rows: [],
      errors: [
        {
          line: 0,
          message:
            'Colonnes attendues introuvables. Le fichier doit contenir au minimum : nom, sku, prix_achat, prix_vente.',
        },
      ],
    };
  }

  const rows: ParsedProductRow[] = [];
  const errors: ProductsCsvParseError[] = [];

  parsed.data.forEach((raw, index) => {
    const line = index + 2; // ligne 1 = en-têtes, +1 pour base 1
    const name = raw[columns.name!]?.trim();
    const sku = raw[columns.sku!]?.trim();
    const purchasePriceRaw = raw[columns.purchasePrice!]?.trim();
    const salePriceRaw = raw[columns.salePrice!]?.trim();
    const stockRaw = columns.initialStock ? raw[columns.initialStock]?.trim() : '';

    if (!name) {
      errors.push({ line, message: 'Nom manquant.' });
      return;
    }
    if (!sku) {
      errors.push({ line, message: 'SKU manquant.' });
      return;
    }

    const purchasePrice = Number(purchasePriceRaw);
    if (!purchasePriceRaw || Number.isNaN(purchasePrice) || purchasePrice <= 0) {
      errors.push({ line, message: "Prix d'achat invalide." });
      return;
    }

    const salePrice = Number(salePriceRaw);
    if (!salePriceRaw || Number.isNaN(salePrice) || salePrice <= 0) {
      errors.push({ line, message: 'Prix de vente invalide.' });
      return;
    }

    const initialStock = stockRaw ? Number(stockRaw) : 0;
    if (Number.isNaN(initialStock) || initialStock < 0) {
      errors.push({ line, message: 'Stock initial invalide.' });
      return;
    }

    rows.push({ line, name, sku, purchasePrice, salePrice, initialStock });
  });

  return { rows, errors };
}

export function buildProductsCsvTemplate(): string {
  return Papa.unparse({
    fields: ['nom', 'sku', 'prix_achat', 'prix_vente', 'stock_initial'],
    data: [['Riz 25kg', 'RIZ-25KG', '12000', '15000', '20']],
  });
}
