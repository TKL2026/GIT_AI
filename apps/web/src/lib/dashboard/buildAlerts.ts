import type { CrossSellPairDto, FraudAnomalyDto, ProductToPushDto, PurchaseOrderDto, PurchaseRecommendationDto } from '@copilote/shared';
import dayjs from 'dayjs';
import type { StockHealthSummary } from './computeStockHealth';

export type AlertSeverity = 'critical' | 'warning' | 'opportunity' | 'info';

export interface DashboardAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
}

export interface BuildAlertsInput {
  stockHealth: StockHealthSummary;
  fraudAnomalies: FraudAnomalyDto[];
  purchaseRecommendations: PurchaseRecommendationDto[];
  productsToPush: ProductToPushDto[];
  crossSell: CrossSellPairDto[];
  pendingOrders: PurchaseOrderDto[];
  /** Injectable pour les tests ; sinon l'heure réelle. */
  now?: Date;
}

const STALE_ORDER_DAYS = 7;
const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, opportunity: 2, info: 3 };

function plural(count: number, base: string, suffix = 's'): string {
  return count > 1 ? `${base}${suffix}` : base;
}

/**
 * Synthèse honnête : chaque carte vient d'un signal réel déjà calculé
 * ailleurs (stock, fraude, achats, commercial). Aucun texte n'est inventé —
 * si aucun input ne déclenche de carte, la liste est vide et l'appelant
 * doit afficher "Tout va bien pour le moment." plutôt que de fabriquer une alerte.
 */
export function buildAlerts(input: BuildAlertsInput): DashboardAlert[] {
  const { stockHealth, fraudAnomalies, purchaseRecommendations, productsToPush, crossSell, pendingOrders } = input;
  const now = input.now ?? new Date();
  const alerts: DashboardAlert[] = [];

  if (stockHealth.ruptureCount > 0) {
    alerts.push({
      id: 'stock-rupture',
      severity: 'critical',
      title: `${stockHealth.ruptureCount} ${plural(stockHealth.ruptureCount, 'produit')} en rupture de stock`,
      description: "Ces produits ne peuvent plus être vendus tant qu'ils ne sont pas réapprovisionnés.",
      actionLabel: 'Voir le stock',
      actionTo: '/stock',
    });
  }

  const highFraud = fraudAnomalies.filter((a) => a.severity === 'high');
  if (highFraud.length > 0) {
    alerts.push({
      id: 'fraud-high',
      severity: 'critical',
      title: `${highFraud.length} ${plural(highFraud.length, 'anomalie')} à vérifier`,
      description: highFraud[0].description,
      actionLabel: 'Voir le détail',
      actionTo: '/finance',
    });
  }

  if (stockHealth.soonCount > 0) {
    alerts.push({
      id: 'stock-soon',
      severity: 'warning',
      title: `${stockHealth.soonCount} ${plural(stockHealth.soonCount, 'produit')} bientôt en rupture`,
      description: 'Ces produits atteignent leur seuil minimum ou seront bientôt épuisés au rythme de vente actuel.',
      actionLabel: 'Voir le stock',
      actionTo: '/stock',
    });
  }

  const mediumFraud = fraudAnomalies.filter((a) => a.severity === 'medium');
  if (mediumFraud.length > 0) {
    alerts.push({
      id: 'fraud-medium',
      severity: 'warning',
      title: `${mediumFraud.length} ${plural(mediumFraud.length, 'anomalie')} mineure${mediumFraud.length > 1 ? 's' : ''}`,
      description: mediumFraud[0].description,
      actionLabel: 'Voir le détail',
      actionTo: '/finance',
    });
  }

  const staleOrders = pendingOrders.filter((o) => dayjs(now).diff(dayjs(o.createdAt), 'day') >= STALE_ORDER_DAYS);
  if (staleOrders.length > 0) {
    alerts.push({
      id: 'purchase-stale',
      severity: 'warning',
      title: `${staleOrders.length} ${plural(staleOrders.length, 'commande')} en attente depuis plus de ${STALE_ORDER_DAYS} jours`,
      description: 'Relancez le fournisseur ou mettez à jour le statut de la commande.',
      actionLabel: 'Voir les achats',
      actionTo: '/purchases',
    });
  }

  if (productsToPush.length > 0) {
    alerts.push({
      id: 'commercial-push',
      severity: 'opportunity',
      title: `${productsToPush.length} ${plural(productsToPush.length, 'produit')} à forte marge ${productsToPush.length > 1 ? 'dorment' : 'dort'} en stock`,
      description: `${productsToPush[0].productName} n'a eu aucune vente récente malgré une bonne marge.`,
      actionLabel: 'Voir les recommandations',
      actionTo: '/commercial',
    });
  }

  if (crossSell.length > 0) {
    alerts.push({
      id: 'commercial-cross-sell',
      severity: 'opportunity',
      title: `${crossSell.length} ${plural(crossSell.length, 'association')} d'achats identifiée${crossSell.length > 1 ? 's' : ''}`,
      description: `${crossSell[0].productAName} et ${crossSell[0].productBName} sont souvent achetés ensemble.`,
      actionLabel: 'Voir le commercial',
      actionTo: '/commercial',
    });
  }

  const withReorder = purchaseRecommendations.filter((r) => r.recommendedQuantity > 0);
  if (withReorder.length > 0) {
    alerts.push({
      id: 'purchase-recommendation',
      severity: 'info',
      title: `${withReorder.length} ${plural(withReorder.length, 'produit')} à réapprovisionner`,
      description: withReorder[0].recommendedSupplierName
        ? `Fournisseur habituel identifié : ${withReorder[0].recommendedSupplierName}.`
        : 'Recommandation basée sur la vélocité de vente récente.',
      actionLabel: 'Préparer les commandes',
      actionTo: '/purchases',
    });
  }

  return alerts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
