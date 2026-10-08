import dayjs from 'dayjs';
import type { DailyBucket } from './bucketSalesByDay';

export type PerformanceMetric = 'revenue' | 'salesCount' | 'margin' | 'marginRatio';

export interface PerformancePoint {
  label: string;
  current: number | null;
  previous: number | null;
}

function metricValue(bucket: DailyBucket, metric: PerformanceMetric): number {
  switch (metric) {
    case 'revenue':
      return bucket.revenue;
    case 'salesCount':
      return bucket.salesCount;
    case 'margin':
      return bucket.margin;
    case 'marginRatio':
      return bucket.revenue > 0 ? (bucket.margin / bucket.revenue) * 100 : 0;
  }
}

/**
 * Aligne la période courante et la période précédente par index de jour
 * relatif (jour 1 de chacune, jour 2 de chacune...) plutôt que par date
 * calendaire — c'est la seule façon de superposer deux périodes de dates
 * différentes sur un même axe.
 */
export function buildPerformanceSeries(
  current: DailyBucket[],
  previous: DailyBucket[],
  metric: PerformanceMetric,
): PerformancePoint[] {
  const length = Math.max(current.length, previous.length);
  return Array.from({ length }, (_, i) => {
    const curBucket = current[i];
    const prevBucket = previous[i];
    return {
      label: curBucket ? dayjs(curBucket.date).format('DD/MM') : String(i + 1),
      current: curBucket ? metricValue(curBucket, metric) : null,
      previous: prevBucket ? metricValue(prevBucket, metric) : null,
    };
  });
}

/**
 * BUG-001 : sans aucune vente, toutes les valeurs valent 0 et Recharts
 * invente un axe arbitraire (ex. 0/1/2/3/4) faute de vraie échelle — permet
 * au Dashboard de préférer un état vide explicite à ce graphique trompeur.
 */
export function hasPerformanceActivity(series: PerformancePoint[]): boolean {
  return series.some((p) => (p.current ?? 0) !== 0 || (p.previous ?? 0) !== 0);
}
