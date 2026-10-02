import { classifyComplexity } from './model-router';
import { DAILY_REPORT_PROMPT } from './prompts';

describe('classifyComplexity', () => {
  describe('messages simples (Haiku attendu)', () => {
    const simpleMessages = [
      'Combien ai-je de produits ?',
      'Quels produits sont en rupture ?',
      "Combien ai-je vendu aujourd'hui ?",
      'Quels achats sont en attente ?',
      'Qui sont mes fournisseurs ?',
      'Quel est le stock disponible pour le riz 25kg ?',
    ];

    it.each(simpleMessages)('classe "%s" comme simple', (message) => {
      expect(classifyComplexity(message)).toBe('simple');
    });
  });

  describe('messages complexes (Sonnet attendu)', () => {
    const complexMessages = [
      'Analyse mes performances financières et explique-moi pourquoi ma marge baisse.',
      'Compare mes ventes, mon stock et mes achats et dis-moi ce que je devrais faire.',
      "Prépare-moi un rapport complet de directeur d'exploitation.",
    ];

    it.each(complexMessages)('classe "%s" comme complexe', (message) => {
      expect(classifyComplexity(message)).toBe('complex');
    });

    it('ne route JAMAIS vers Haiku une demande d\'analyse croisée multi-domaines, même formulée simplement (règle absolue)', () => {
      const forbidden = 'Analyse mes ventes, ma marge, mes stocks et mes achats et donne-moi les actions prioritaires.';
      expect(classifyComplexity(forbidden)).toBe('complex');
    });

    it('route le rapport quotidien (DAILY_REPORT_PROMPT) vers Sonnet', () => {
      expect(classifyComplexity(DAILY_REPORT_PROMPT)).toBe('complex');
    });

    it('force Sonnet dès que 3 domaines métier ou plus sont combinés, même sans mot-clé d\'analyse', () => {
      expect(classifyComplexity('Donne-moi mes ventes, mon stock et mes achats.')).toBe('complex');
    });

    it('force Sonnet pour un message ambigu/hors des signaux simples connus (biais de sécurité par défaut)', () => {
      expect(classifyComplexity('Bonjour, comment ça va ?')).toBe('complex');
    });

    it('force Sonnet pour un message simple en apparence mais anormalement long, même sans mot-clé complexe', () => {
      const long =
        'Quels produits sont en rupture de stock dans mon magasin en ce moment, et est-ce que tu peux me dire lesquels ont le plus faible niveau actuellement avant que je ne parte en réunion ce matin ?';
      expect(long.length).toBeGreaterThan(180);
      expect(classifyComplexity(long)).toBe('complex');
    });
  });
});
