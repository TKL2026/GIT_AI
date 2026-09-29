import dayjs from 'dayjs';

export type PeriodKey = 'today' | '7d' | '30d' | '90d' | 'custom';

export const PERIODS: Record<Exclude<PeriodKey, 'custom'>, { label: string; days: number }> = {
  today: { label: "Aujourd'hui", days: 1 },
  '7d': { label: '7 jours', days: 7 },
  '30d': { label: '30 jours', days: 30 },
  '90d': { label: '90 jours', days: 90 },
};

export interface PeriodSelection {
  key: PeriodKey;
  customFrom?: Date | null;
  customTo?: Date | null;
}

export interface PeriodRange {
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
}

function buildRangeFromDays(days: number): PeriodRange {
  const to = dayjs();
  const from = dayjs().subtract(days - 1, 'day').startOf('day');
  const prevTo = from.subtract(1, 'second');
  const prevFrom = prevTo.subtract(days - 1, 'day').startOf('day');
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    prevFrom: prevFrom.toISOString(),
    prevTo: prevTo.toISOString(),
  };
}

function buildCustomRange(customFrom: Date, customTo: Date): PeriodRange {
  const from = dayjs(customFrom).startOf('day');
  const to = dayjs(customTo).endOf('day');
  const days = Math.max(to.diff(from, 'day') + 1, 1);
  const prevTo = from.subtract(1, 'second');
  const prevFrom = prevTo.subtract(days - 1, 'day').startOf('day');
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    prevFrom: prevFrom.toISOString(),
    prevTo: prevTo.toISOString(),
  };
}

/**
 * `customFrom`/`customTo` ne sont utilisées que pour key === 'custom'. Tant
 * que l'utilisateur n'a pas choisi les deux dates, on retombe sur 7 jours
 * plutôt que de planter — le sélecteur "Personnalisé" les fournit dès que
 * l'utilisateur a validé sa plage (branché en Phase 2).
 */
export function getPeriodRange(selection: PeriodSelection): PeriodRange {
  if (selection.key === 'custom') {
    if (selection.customFrom && selection.customTo) {
      return buildCustomRange(selection.customFrom, selection.customTo);
    }
    return buildRangeFromDays(PERIODS['7d'].days);
  }
  return buildRangeFromDays(PERIODS[selection.key].days);
}

export function changeRatio(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}
