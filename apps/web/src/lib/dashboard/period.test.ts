import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { changeRatio, getPeriodRange } from './period';

describe('getPeriodRange', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-08-24T15:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("couvre les 7 derniers jours pour '7d'", () => {
    const range = getPeriodRange({ key: '7d' });
    const days = dayjs(range.to).diff(dayjs(range.from), 'day');
    expect(days).toBe(6);
    expect(dayjs(range.to).isSame(dayjs(), 'second')).toBe(true);
  });

  it("place la période précédente immédiatement avant la période courante", () => {
    const range = getPeriodRange({ key: '30d' });
    expect(dayjs(range.prevTo).isBefore(dayjs(range.from))).toBe(true);
    const prevDays = dayjs(range.prevTo).diff(dayjs(range.prevFrom), 'day');
    expect(prevDays).toBe(29);
  });

  it("couvre 90 jours pour '90d'", () => {
    const range = getPeriodRange({ key: '90d' });
    const days = dayjs(range.to).diff(dayjs(range.from), 'day');
    expect(days).toBe(89);
  });

  it("utilise les dates fournies pour 'custom'", () => {
    const range = getPeriodRange({
      key: 'custom',
      customFrom: new Date('2026-08-01T00:00:00.000Z'),
      customTo: new Date('2026-08-10T00:00:00.000Z'),
    });
    expect(dayjs(range.from).format('YYYY-MM-DD')).toBe('2026-08-01');
    expect(dayjs(range.to).format('YYYY-MM-DD')).toBe('2026-08-10');
    const prevDays = dayjs(range.prevTo).diff(dayjs(range.prevFrom), 'day');
    expect(prevDays).toBe(9);
  });

  it("retombe sur 7 jours si 'custom' est sélectionné sans dates", () => {
    const range = getPeriodRange({ key: 'custom' });
    const days = dayjs(range.to).diff(dayjs(range.from), 'day');
    expect(days).toBe(6);
  });
});

describe('changeRatio', () => {
  it('retourne null si la période précédente est à 0', () => {
    expect(changeRatio(100, 0)).toBeNull();
  });

  it('calcule une variation positive', () => {
    expect(changeRatio(120, 100)).toBeCloseTo(0.2);
  });

  it('calcule une variation négative', () => {
    expect(changeRatio(80, 100)).toBeCloseTo(-0.2);
  });
});
