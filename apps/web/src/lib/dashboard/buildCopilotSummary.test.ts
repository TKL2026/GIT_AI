import { describe, expect, it } from 'vitest';
import { buildCopilotSummary } from './buildCopilotSummary';

describe('buildCopilotSummary', () => {
  it('décrit une progression de chiffre d\'affaires', () => {
    const summary = buildCopilotSummary({
      revenueChangeRatio: 0.12,
      criticalCount: 0,
      warningCount: 0,
      opportunityCount: 0,
      periodLabel: '7 jours',
    });
    expect(summary).toContain('progressé de 12 %');
    expect(summary).toContain('Aucun problème détecté');
  });

  it('décrit un recul de chiffre d\'affaires', () => {
    const summary = buildCopilotSummary({
      revenueChangeRatio: -0.08,
      criticalCount: 0,
      warningCount: 0,
      opportunityCount: 0,
      periodLabel: '30 jours',
    });
    expect(summary).toContain('reculé de 8 %');
  });

  it('omet la phrase de variation quand revenueChangeRatio est null (pas de période précédente comparable)', () => {
    const summary = buildCopilotSummary({
      revenueChangeRatio: null,
      criticalCount: 0,
      warningCount: 0,
      opportunityCount: 0,
      periodLabel: '7 jours',
    });
    expect(summary).not.toContain('chiffre d\'affaires');
  });

  it('signale les points nécessitant attention (singulier)', () => {
    const summary = buildCopilotSummary({
      revenueChangeRatio: null,
      criticalCount: 1,
      warningCount: 0,
      opportunityCount: 0,
      periodLabel: '7 jours',
    });
    expect(summary).toContain('1 point nécessite votre attention.');
  });

  it('signale les points nécessitant attention (pluriel, critique + attention combinés)', () => {
    const summary = buildCopilotSummary({
      revenueChangeRatio: null,
      criticalCount: 2,
      warningCount: 1,
      opportunityCount: 0,
      periodLabel: '7 jours',
    });
    expect(summary).toContain('3 points nécessitent votre attention.');
  });

  it('mentionne les opportunités identifiées', () => {
    const summary = buildCopilotSummary({
      revenueChangeRatio: null,
      criticalCount: 0,
      warningCount: 0,
      opportunityCount: 2,
      periodLabel: '7 jours',
    });
    expect(summary).toContain('2 opportunités identifiées côté commercial.');
  });
});
