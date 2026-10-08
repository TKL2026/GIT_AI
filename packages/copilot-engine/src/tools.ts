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
      "Renvoie les produits en rupture (stock à 0, même sans seuil configuré) ou dont la quantité en stock est en dessous (ou égale) de leur seuil minimum configuré — risques de rupture. Chaque produit inclut `stockStatus` ('out' | 'low' | 'ok'), le statut officiel déjà calculé par le backend : fie-toi à ce champ plutôt que de recalculer un verdict à partir de `stockQuantity`/`minStock`. Renvoie aussi `totalCount`, le nombre total d'alertes (toujours exact même si la liste `items` est limitée) — utile pour répondre à une question de comptage sans avoir besoin de la liste complète.",
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Nombre maximum de produits à renvoyer (défaut 50, maximum 200).',
        },
      },
    },
  },
  {
    name: 'get_products',
    description:
      "Renvoie le catalogue des produits avec prix d'achat, prix de vente, quantité en stock et `stockStatus` ('out' | 'low' | 'ok', le statut de stock officiel déjà calculé par le backend — à utiliser tel quel plutôt que de le redéduire de `stockQuantity`/`minStock`), ainsi que `totalCount`, le nombre total de produits (toujours exact même si la liste `items` est limitée) — utile pour répondre à une question de comptage ('combien de produits ?') sans avoir besoin du catalogue complet. Augmente `limit` si une analyse porte réellement sur le détail de nombreux produits.",
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Nombre maximum de produits à renvoyer (défaut 50, maximum 200).',
        },
      },
    },
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
    description:
      "Renvoie les commandes fournisseurs actuellement en attente de réception, ainsi que `totalCount`, le nombre total de commandes en attente (toujours exact même si la liste `items` est limitée).",
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Nombre maximum de commandes à renvoyer (défaut 30, maximum 100).',
        },
      },
    },
  },
  {
    name: 'get_suppliers',
    description:
      "Renvoie la liste des fournisseurs de l'entreprise, ainsi que `totalCount`, le nombre total de fournisseurs (toujours exact même si la liste `items` est limitée).",
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Nombre maximum de fournisseurs à renvoyer (défaut 50, maximum 200).',
        },
      },
    },
  },
  {
    name: 'get_replenishment_forecast',
    description:
      "Renvoie, pour chaque produit, une prévision de réapprovisionnement calculée à partir de la vélocité de vente des 30 derniers jours : ventes moyennes par jour, nombre de jours estimé avant rupture de stock, et quantité recommandée à commander. Trié du plus urgent au moins urgent ; les produits sans vente récente n'ont pas de prévision (valeurs nulles). Renvoie aussi `totalCount`, le nombre total de produits couverts par la prévision.",
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Nombre maximum de lignes à renvoyer (défaut 50, maximum 200).',
        },
      },
    },
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
  {
    name: 'get_products_to_push',
    description:
      "Renvoie les produits rentables (marge positive), en stock, mais sans aucune vente sur les 30 derniers jours — des opportunités à mettre en avant auprès des clients. Triés par marge par unité décroissante.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_customer_insights',
    description:
      "Renvoie les clients identifiés (par téléphone ou nom renseigné à la vente), avec leur dépense totale, leur nombre d'achats et le nombre de jours depuis leur dernier achat. Triés par dépense décroissante. Utile pour identifier les meilleurs clients ou ceux à relancer (nombre de jours depuis le dernier achat élevé alors qu'ils ont déjà acheté plusieurs fois).",
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Nombre maximum de clients à renvoyer (défaut 10, maximum 20).',
        },
      },
    },
  },
  {
    name: 'get_cross_sell_opportunities',
    description:
      "Renvoie les paires de produits fréquemment achetés ensemble (au moins 2 fois) sur les 90 derniers jours, triées par fréquence de co-achat décroissante. Utile pour suggérer des ventes croisées ('les clients qui achètent X achètent souvent aussi Y').",
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Nombre maximum de paires à renvoyer (défaut 10, maximum 20).',
        },
      },
    },
  },
  {
    name: 'get_purchase_recommendations',
    description:
      "Renvoie, pour chaque produit à réapprovisionner (d'après la prévision), la quantité recommandée et le fournisseur suggéré (le moins cher parmi ceux ayant déjà fourni ce produit, d'après l'historique des commandes). Si aucun historique n'existe pour un produit, le signale explicitement (pas de fournisseur à deviner). Trié du plus urgent au moins urgent. Renvoie aussi `totalCount`, le nombre total de produits à réapprovisionner.",
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Nombre maximum de recommandations à renvoyer (défaut 50, maximum 200).',
        },
      },
    },
  },
];
