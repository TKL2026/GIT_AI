export interface CopilotSummaryInput {
  revenueChangeRatio: number | null;
  criticalCount: number;
  warningCount: number;
  opportunityCount: number;
  periodLabel: string;
}

/**
 * Phrase générée par règles, à partir des mêmes chiffres déjà affichés dans
 * les sections Santé et Alertes — jamais un appel au LLM, pour respecter
 * l'exigence de ne pas déclencher d'appel IA à chaque chargement du
 * dashboard. Le bouton "Analyse complète" reste le seul déclencheur du
 * vrai rapport IA (/copilot/daily-report).
 */
export function buildCopilotSummary(input: CopilotSummaryInput): string {
  const { revenueChangeRatio, criticalCount, warningCount, opportunityCount, periodLabel } = input;
  const parts: string[] = [];

  if (revenueChangeRatio !== null) {
    const pct = Math.abs(revenueChangeRatio * 100).toFixed(0);
    parts.push(
      revenueChangeRatio >= 0
        ? `Votre chiffre d'affaires a progressé de ${pct} % sur ${periodLabel}.`
        : `Votre chiffre d'affaires a reculé de ${pct} % sur ${periodLabel}.`,
    );
  }

  const problems = criticalCount + warningCount;
  if (problems > 0) {
    parts.push(
      problems > 1
        ? `${problems} points nécessitent votre attention.`
        : `${problems} point nécessite votre attention.`,
    );
  } else {
    parts.push('Aucun problème détecté sur cette période.');
  }

  if (opportunityCount > 0) {
    parts.push(
      opportunityCount > 1
        ? `${opportunityCount} opportunités identifiées côté commercial.`
        : `${opportunityCount} opportunité identifiée côté commercial.`,
    );
  }

  return parts.join(' ');
}
