/**
 * Source unique des codes de fonctionnalités UGE — partagée entre l'API
 * (FeatureGuard, seed des Plans) et le frontend (affichage/masquage UX
 * uniquement). Ne jamais dupliquer cette liste ailleurs.
 *
 * Seules les fonctionnalités qui ont une implémentation technique distincte
 * apparaissent ici. Le Copilot IA n'a par exemple qu'une seule implémentation
 * (pas de version "avancée" séparée dans le code) — il n'y a donc qu'un seul
 * code COPILOT_BASIC, inclus dans Standard comme dans Pro.
 */
export const FEATURES = {
  // Cœur ERP — inclus dans toutes les offres payantes (Standard et Pro) et
  // dans l'essai. Non protégés individuellement côté backend par
  // @RequireFeature : Standard et Pro les incluent tous les deux, un garde
  // supplémentaire n'aurait aucun effet (déjà couvert par SubscriptionGuard).
  DASHBOARD: 'dashboard',
  PRODUCTS: 'products',
  STOCK: 'stock',
  SALES: 'sales',
  PURCHASES: 'purchases',
  SUPPLIERS: 'suppliers',
  FINANCE_BASIC: 'finance_basic',
  EXPENSES: 'expenses',
  REPORTS_STANDARD: 'reports_standard',
  ORGANIZATION: 'organization',
  TEAM: 'team',
  COPILOT_BASIC: 'copilot_basic',

  // Fonctionnalités Pro — réellement protégées par @RequireFeature côté API.
  FORECAST: 'forecast',
  FRAUD: 'fraud',
  FINANCE_ADVANCED: 'finance_advanced',
  COMMERCIAL: 'commercial',
  PURCHASING_AI: 'purchasing_ai',
  WHATSAPP: 'whatsapp',
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];

export const STANDARD_FEATURES: Feature[] = [
  FEATURES.DASHBOARD,
  FEATURES.PRODUCTS,
  FEATURES.STOCK,
  FEATURES.SALES,
  FEATURES.PURCHASES,
  FEATURES.SUPPLIERS,
  FEATURES.FINANCE_BASIC,
  FEATURES.EXPENSES,
  FEATURES.REPORTS_STANDARD,
  FEATURES.ORGANIZATION,
  FEATURES.TEAM,
  FEATURES.COPILOT_BASIC,
];

/** Pro = Standard + ces fonctionnalités supplémentaires (héritage explicite,
 * jamais dupliqué — voir PRO_FEATURES ci-dessous). */
export const PRO_ONLY_FEATURES: Feature[] = [
  FEATURES.FORECAST,
  FEATURES.FRAUD,
  FEATURES.FINANCE_ADVANCED,
  FEATURES.COMMERCIAL,
  FEATURES.PURCHASING_AI,
  FEATURES.WHATSAPP,
];

export const PRO_FEATURES: Feature[] = [...STANDARD_FEATURES, ...PRO_ONLY_FEATURES];

/** Forme attendue du JSON stocké dans Plan.features. */
export interface PlanFeaturesJson {
  maxUsers: number | null;
  features: Feature[];
}
