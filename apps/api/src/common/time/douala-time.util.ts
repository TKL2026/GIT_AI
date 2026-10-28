const DOUALA_TIME_ZONE = "Africa/Douala";

const FRENCH_MONTH_LABELS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/**
 * Décalage réel (en minutes) d'un fuseau IANA à un instant donné, calculé
 * uniquement via `Intl` (aucune dépendance) : ne suppose jamais un
 * décalage fixe, même si Africa/Douala (UTC+1, sans heure d'été) n'en a
 * changé depuis des décennies — se recalcule honnêtement à chaque appel.
 */
function getTimeZoneOffsetMinutes(instant: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(instant).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUtc - instant.getTime()) / 60000;
}

/** Date civile ("YYYY-MM-DD") à Africa/Douala pour l'instant donné (par défaut, maintenant). */
export function getDoualaDateString(instant: Date = new Date()): string {
  const offsetMinutes = getTimeZoneOffsetMinutes(instant, DOUALA_TIME_ZONE);
  const local = new Date(instant.getTime() + offsetMinutes * 60000);
  return local.toISOString().slice(0, 10);
}

/**
 * Bornes UTC \[startUtc, endUtc\) du jour civil Africa/Douala correspondant
 * à `dateString` ("YYYY-MM-DD"). Les timestamps en base sont toujours
 * écrits/lus en UTC (voir Prisma `DateTime` / colonnes `timestamp(3)`) :
 * ces bornes sont directement utilisables dans un filtre `createdAt`.
 */
export function getDoualaDayBoundsUtc(dateString: string): {
  startUtc: Date;
  endUtc: Date;
} {
  const approxUtcMidnight = new Date(`${dateString}T00:00:00.000Z`);
  const offsetMinutes = getTimeZoneOffsetMinutes(
    approxUtcMidnight,
    DOUALA_TIME_ZONE,
  );
  const startUtc = new Date(
    approxUtcMidnight.getTime() - offsetMinutes * 60000,
  );
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { startUtc, endUtc };
}

/**
 * Bornes UTC \[startUtc, endUtc\) du mois civil Africa/Douala correspondant
 * à `monthString` ("YYYY-MM"). `endUtc` est le début (Douala) du 1er jour
 * du mois suivant — réutilise `getDoualaDayBoundsUtc` pour garantir
 * exactement la même logique de décalage que les bornes journalières
 * (pas de recalcul séparé qui pourrait diverger).
 */
export function getDoualaMonthBoundsUtc(monthString: string): {
  startUtc: Date;
  endUtc: Date;
} {
  const [year, month] = monthString.split("-").map(Number);
  const { startUtc } = getDoualaDayBoundsUtc(`${monthString}-01`);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonthFirstDay = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  const { startUtc: endUtc } = getDoualaDayBoundsUtc(nextMonthFirstDay);
  return { startUtc, endUtc };
}

/** Libellé lisible (ex: "18/10/2026") pour une date "YYYY-MM-DD", sans dépendre du fuseau du serveur. */
export function formatDoualaDateLabel(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

/** Libellé lisible (ex: "octobre 2026") pour un mois "YYYY-MM". */
export function formatDoualaMonthLabel(monthString: string): string {
  const [year, month] = monthString.split("-").map(Number);
  return `${FRENCH_MONTH_LABELS[month - 1]} ${year}`;
}
