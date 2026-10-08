import { formatCurrency } from '../format';
import type { ActivityItem } from './mergeActivity';

/**
 * movement.quantity est toujours positif pour IN/OUT (voir mergeActivity.ts)
 * — le signe affiché doit donc venir du type d'activité, pas de son signe
 * mathématique (BUG-007 : une sortie de stock s'affichait "+N unités" au
 * lieu de "−N unités"). Seul l'ajustement a un delta réellement signé, qu'on
 * affiche tel quel.
 */
export function formatActivityAmount(item: ActivityItem): string | null {
  if (item.amount === null) return null;
  if (item.type === 'stock-in') return `+${item.amount} unités`;
  if (item.type === 'stock-out') return `−${item.amount} unités`;
  if (item.type === 'stock-adjustment') {
    return `${item.amount > 0 ? '+' : ''}${item.amount} unités`;
  }
  return formatCurrency(item.amount);
}
