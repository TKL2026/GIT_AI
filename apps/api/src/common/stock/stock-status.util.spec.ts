import { computeStockStatus } from './stock-status.util';

describe('computeStockStatus', () => {
  it('stock > seuil -> ok', () => {
    expect(computeStockStatus(10, 5)).toBe('ok');
  });

  it('stock = seuil -> low', () => {
    expect(computeStockStatus(5, 5)).toBe('low');
  });

  it('stock < seuil -> low', () => {
    expect(computeStockStatus(3, 5)).toBe('low');
  });

  it('stock = 0 (avec seuil configuré) -> out', () => {
    expect(computeStockStatus(0, 5)).toBe('out');
  });

  it('stock = 0 (seuil NON configuré) -> out malgré tout (BUG-003)', () => {
    expect(computeStockStatus(0, null)).toBe('out');
  });

  it('seuil non configuré et stock > 0 -> ok (impossible de qualifier "bas" sans seuil)', () => {
    expect(computeStockStatus(50, null)).toBe('ok');
  });
});
