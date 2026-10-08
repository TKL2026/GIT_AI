import { describe, expect, it } from 'vitest';
import { formatActivityAmount } from './formatActivityAmount';
import type { ActivityItem } from './mergeActivity';

function item(overrides: Partial<ActivityItem> = {}): ActivityItem {
  return {
    id: 'a1',
    type: 'stock-in',
    date: '2026-08-01T00:00:00.000Z',
    title: 'Entrée de stock — Riz',
    amount: 10,
    actorUserId: null,
    linkTo: '/products/p1',
    ...overrides,
  };
}

describe('formatActivityAmount', () => {
  it('BUG-007 : une entrée de stock affiche toujours +N', () => {
    expect(formatActivityAmount(item({ type: 'stock-in', amount: 10 }))).toBe('+10 unités');
  });

  it('BUG-007 : une sortie de stock affiche toujours −N (même si amount est positif en base)', () => {
    expect(formatActivityAmount(item({ type: 'stock-out', amount: 10 }))).toBe('−10 unités');
  });

  it('un ajustement garde son signe réel (delta positif)', () => {
    expect(formatActivityAmount(item({ type: 'stock-adjustment', amount: 5 }))).toBe('+5 unités');
  });

  it('un ajustement garde son signe réel (delta négatif)', () => {
    expect(formatActivityAmount(item({ type: 'stock-adjustment', amount: -3 }))).toBe('-3 unités');
  });

  it('une vente affiche un montant monétaire, pas une quantité', () => {
    expect(formatActivityAmount(item({ type: 'sale', amount: 15000 }))).toContain('15');
  });

  it('renvoie null si amount est null', () => {
    expect(formatActivityAmount(item({ amount: null }))).toBeNull();
  });
});
