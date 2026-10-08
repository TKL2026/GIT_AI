import { describe, expect, it } from 'vitest';
import type { DailyBucket } from './bucketSalesByDay';
import { buildPerformanceSeries, hasPerformanceActivity } from './buildPerformanceSeries';

function bucket(overrides: Partial<DailyBucket> = {}): DailyBucket {
  return { date: '2026-08-10', revenue: 1000, salesCount: 4, margin: 300, ...overrides };
}

describe('buildPerformanceSeries', () => {
  it('aligne courant et précédent par index de jour relatif', () => {
    const current = [bucket({ date: '2026-08-10', revenue: 1000 }), bucket({ date: '2026-08-11', revenue: 2000 })];
    const previous = [bucket({ date: '2026-07-27', revenue: 500 }), bucket({ date: '2026-07-28', revenue: 800 })];
    const series = buildPerformanceSeries(current, previous, 'revenue');
    expect(series).toHaveLength(2);
    expect(series[0]).toMatchObject({ current: 1000, previous: 500 });
    expect(series[1]).toMatchObject({ current: 2000, previous: 800 });
  });

  it("utilise la date de la période courante comme libellé de l'axe", () => {
    const current = [bucket({ date: '2026-08-10' })];
    const previous = [bucket({ date: '2026-07-27' })];
    const series = buildPerformanceSeries(current, previous, 'revenue');
    expect(series[0].label).toBe('10/08');
  });

  it('renvoie null pour le point manquant quand les périodes ont des longueurs différentes', () => {
    const current = [bucket(), bucket()];
    const previous = [bucket()];
    const series = buildPerformanceSeries(current, previous, 'revenue');
    expect(series[1].previous).toBeNull();
  });

  it('extrait le nombre de ventes', () => {
    const bkt = bucket({ salesCount: 7 });
    const series = buildPerformanceSeries([bkt], [bkt], 'salesCount');
    expect(series[0].current).toBe(7);
  });

  it('extrait la marge en valeur', () => {
    const bkt = bucket({ margin: 450 });
    const series = buildPerformanceSeries([bkt], [bkt], 'margin');
    expect(series[0].current).toBe(450);
  });

  it('calcule le taux de marge en pourcentage', () => {
    const bkt = bucket({ revenue: 1000, margin: 250 });
    const series = buildPerformanceSeries([bkt], [bkt], 'marginRatio');
    expect(series[0].current).toBe(25);
  });

  it('renvoie 0 pour le taux de marge quand le chiffre d\'affaires est nul', () => {
    const bkt = bucket({ revenue: 0, margin: 0 });
    const series = buildPerformanceSeries([bkt], [bkt], 'marginRatio');
    expect(series[0].current).toBe(0);
  });
});

describe('hasPerformanceActivity', () => {
  it('BUG-001 : renvoie false quand toutes les valeurs sont nulles ou à 0 (aucune vente)', () => {
    expect(
      hasPerformanceActivity([
        { label: '1', current: 0, previous: 0 },
        { label: '2', current: null, previous: null },
      ]),
    ).toBe(false);
  });

  it('renvoie true dès qu\'une seule valeur (courante ou précédente) est non nulle', () => {
    expect(
      hasPerformanceActivity([
        { label: '1', current: 0, previous: 0 },
        { label: '2', current: 1500, previous: 0 },
      ]),
    ).toBe(true);
  });

  it('renvoie false pour une série vide', () => {
    expect(hasPerformanceActivity([])).toBe(false);
  });
});
