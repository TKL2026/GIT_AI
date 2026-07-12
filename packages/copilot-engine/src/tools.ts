import Anthropic from '@anthropic-ai/sdk';

const dateRangeProperties = {
  from: {
    type: 'string' as const,
    description: 'Date de début au format ISO 8601 (ex: 2026-07-01). Optionnel.',
  },
  to: {
    type: 'string' as const,
    description: 'Date de fin au format ISO 8601 (ex: 2026-07-31). Optionnel.',
  },
};

export const COPILOT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_finance_summary',
    description:
      "Renvoie le résumé financier de l'entreprise sur une période : chiffre d'affaires, dépenses, coût des marchandises vendues, marge brute, bénéfice net, nombre de ventes.",
    input_schema: {
      type: 'object',
      properties: dateRangeProperties,
    },
  },
  {
    name: 'get_products_profitability',
    description:
      'Renvoie, pour chaque produit vendu sur la période, la quantité vendue, le chiffre d’affaires, le coût estimé et la marge estimée, triés par marge décroissante.',
    input_schema: {
      type: 'object',
      properties: dateRangeProperties,
    },
  },
  {
    name: 'get_stock_alerts',
    description:
      'Renvoie les produits dont la quantité en stock est en dessous (ou égale) de leur seuil minimum — risques de rupture.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_products',
    description: "Renvoie le catalogue complet des produits avec prix d'achat, prix de vente et quantité en stock.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_recent_sales',
    description: 'Renvoie les ventes les plus récentes de l’entreprise, avec le détail des articles vendus.',
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Nombre maximum de ventes à renvoyer (défaut 20, max 50).',
        },
      },
    },
  },
  {
    name: 'get_pending_purchase_orders',
    description: "Renvoie les commandes fournisseurs actuellement en attente de réception.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_suppliers',
    description: "Renvoie la liste des fournisseurs de l'entreprise.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_replenishment_forecast',
    description:
      "Renvoie, pour chaque produit, une prévision de réapprovisionnement calculée à partir de la vélocité de vente des 30 derniers jours : ventes moyennes par jour, nombre de jours estimé avant rupture de stock, et quantité recommandée à commander. Trié du plus urgent au moins urgent ; les produits sans vente récente n'ont pas de prévision (valeurs nulles).",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_fraud_anomalies',
    description:
      "Renvoie une liste de signaux statistiques à vérifier humainement, calculés sur les 30 derniers jours : ajustements de stock à la baisse sans motif renseigné, et ventes conclues à un prix nettement inférieur au prix catalogue. Ce sont des indices à examiner, PAS des preuves de fraude — présente-les toujours comme des points à vérifier avec l'employé ou le contexte concerné, jamais comme une accusation.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_monthly_finance_trend',
    description:
      "Renvoie l'évolution financière mois par mois (chiffre d'affaires, dépenses, marge brute, bénéfice net, nombre de ventes) sur plusieurs mois, du plus ancien au plus récent, avec des ratios (marge brute, marge nette) et la croissance du chiffre d'affaires par rapport au mois précédent. Utile pour répondre à des questions sur les tendances ou l'évolution dans le temps, pas seulement un instantané.",
    input_schema: {
      type: 'object',
      properties: {
        months: {
          type: 'number',
          description: "Nombre de mois à inclure, du plus ancien au plus récent (défaut 6, maximum 12).",
        },
      },
    },
  },
];
