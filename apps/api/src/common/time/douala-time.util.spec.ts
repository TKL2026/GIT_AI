import {
  formatDoualaDateLabel,
  formatDoualaMonthLabel,
  getDoualaDateString,
  getDoualaDayBoundsUtc,
  getDoualaMonthBoundsUtc,
} from './douala-time.util';

describe('douala-time.util', () => {
  describe('getDoualaDateString', () => {
    it('reste sur le même jour civil quand il est encore avant minuit à Douala (UTC+1)', () => {
      // 2026-10-18T22:30:00Z = 2026-10-18T23:30:00 à Douala (encore le 18).
      expect(getDoualaDateString(new Date('2026-10-18T22:30:00.000Z'))).toBe('2026-10-18');
    });

    it('bascule au jour suivant une heure avant minuit UTC, à cause du décalage +1', () => {
      // 2026-10-18T23:30:00Z = 2026-10-19T00:30:00 à Douala (déjà le 19).
      expect(getDoualaDateString(new Date('2026-10-18T23:30:00.000Z'))).toBe('2026-10-19');
    });
  });

  describe('getDoualaDayBoundsUtc', () => {
    it('calcule minuit Douala comme 23h UTC la veille (UTC+1 fixe, pas d’heure d’été)', () => {
      const { startUtc, endUtc } = getDoualaDayBoundsUtc('2026-10-18');

      expect(startUtc.toISOString()).toBe('2026-10-17T23:00:00.000Z');
      expect(endUtc.toISOString()).toBe('2026-10-18T23:00:00.000Z');
    });

    it('produit exactement 24h entre les deux bornes', () => {
      const { startUtc, endUtc } = getDoualaDayBoundsUtc('2026-01-01');
      expect(endUtc.getTime() - startUtc.getTime()).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe('getDoualaMonthBoundsUtc', () => {
    it('borne un mois normal (octobre 2026) du 1er 23h UTC (veille) au 1er du mois suivant', () => {
      const { startUtc, endUtc } = getDoualaMonthBoundsUtc('2026-10');

      expect(startUtc.toISOString()).toBe('2026-09-30T23:00:00.000Z');
      expect(endUtc.toISOString()).toBe('2026-10-31T23:00:00.000Z');
    });

    it('franchit correctement un changement d’année (décembre -> janvier)', () => {
      const { endUtc } = getDoualaMonthBoundsUtc('2026-12');
      // Le 1er janvier 2027 à Douala = 2026-12-31T23:00:00Z.
      expect(endUtc.toISOString()).toBe('2026-12-31T23:00:00.000Z');
    });

    it('gère correctement un mois de 28/29 jours (février)', () => {
      const { startUtc, endUtc } = getDoualaMonthBoundsUtc('2026-02');
      expect(startUtc.toISOString()).toBe('2026-01-31T23:00:00.000Z');
      expect(endUtc.toISOString()).toBe('2026-02-28T23:00:00.000Z');
    });
  });

  describe('formatDoualaDateLabel', () => {
    it('formate "YYYY-MM-DD" en "DD/MM/YYYY"', () => {
      expect(formatDoualaDateLabel('2026-10-18')).toBe('18/10/2026');
    });
  });

  describe('formatDoualaMonthLabel', () => {
    it('formate "YYYY-MM" en "mois année" en français', () => {
      expect(formatDoualaMonthLabel('2026-10')).toBe('octobre 2026');
      expect(formatDoualaMonthLabel('2026-01')).toBe('janvier 2026');
      expect(formatDoualaMonthLabel('2026-12')).toBe('décembre 2026');
    });
  });
});
