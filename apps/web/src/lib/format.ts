const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return `${currencyFormatter.format(amount)} FCFA`;
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(date: string | Date): string {
  return dateFormatter.format(new Date(date));
}

export function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${(value * 100).toFixed(1)} %`;
}
