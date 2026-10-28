import { inflateSync } from 'zlib';
import { DailyReportResponseDto } from './dto/daily-report-response.dto';
import { MonthlyReportResponseDto } from './dto/monthly-report-response.dto';
import { buildDailyReportPdf, buildMonthlyReportPdf, formatXaf } from './reports-pdf.builder';

const dailyReport: DailyReportResponseDto = {
  date: '2026-10-18',
  dateLabel: '18/10/2026',
  organizationName: 'Boutique Awa',
  hasActivity: true,
  totalRevenue: 66500,
  totalExpenses: 10000,
  totalCogs: 60000,
  grossMargin: 65000,
  netProfit: 55000,
  salesCount: 7,
  topProducts: [
    { productId: 'p1', productName: 'Riz', quantitySold: 10, totalRevenue: 50000, estimatedCost: 30000, estimatedMargin: 1000 },
  ],
  stockAlerts: [{ productId: 's1', productName: 'Huile', stockQuantity: 0, minStock: 5, status: 'out' }],
};

const monthlyReport: MonthlyReportResponseDto = {
  month: '2026-10',
  monthLabel: 'octobre 2026',
  organizationName: 'Boutique Awa',
  hasActivity: true,
  totalRevenue: 1000000,
  totalExpenses: 150000,
  totalCogs: 1200000,
  grossMargin: 1300000,
  netProfit: 1150000,
  salesCount: 140,
  topProducts: [],
  stockAlerts: [],
};

/**
 * Extrait le texte réellement transmis au flux de contenu PDF (ce qui sera
 * effectivement rendu par la police), pas juste la chaîne JS passée en
 * entrée avant mise en forme PDF — la seule façon de vérifier un problème
 * d'encodage au niveau de la police (voir le bug U+202F remonté par le QA).
 *
 * Décompresse chaque flux `stream...endstream` du PDF (pdfkit compresse
 * ses flux de contenu en zlib/Flate standard, décompressible nativement
 * avec `zlib` — donc aucune dépendance externe de parsing PDF nécessaire :
 * les deux testées (`pdf-parse`, `pdf2json`) échouent sur les PDF produits
 * par la version de pdfkit de ce projet, "bad/invalid XRef..." — un bug
 * de compatibilité de ces librairies, pas du PDF généré, confirmé en
 * vérifiant manuellement que le `xref`/`startxref` du fichier est correct).
 * Dans chaque flux décompressé, les chaînes de texte des opérateurs
 * Tj/TJ apparaissent en hexadécimal entre `<...>` — décodées et concaténées
 * ici pour obtenir le texte réellement codé dans le PDF.
 */
function extractPdfRenderedText(buffer: Buffer): string {
  const raw = buffer.toString('latin1');
  let cursor = 0;
  let decodedText = '';

  for (;;) {
    const streamKeywordIndex = raw.indexOf('stream', cursor);
    if (streamKeywordIndex === -1) break;
    const contentStart = streamKeywordIndex + 'stream'.length + 1; // +1 pour le \n
    const contentEnd = raw.indexOf('endstream', contentStart);
    if (contentEnd === -1) break;
    const rawStream = buffer.subarray(contentStart, contentEnd - 1); // -1 pour le \n avant endstream

    try {
      const inflated = inflateSync(rawStream).toString('latin1');
      const hexStrings = inflated.match(/<([0-9A-Fa-f]+)>/g) ?? [];
      for (const hex of hexStrings) {
        decodedText += Buffer.from(hex.slice(1, -1), 'hex').toString('latin1');
      }
    } catch {
      // Flux non-Flate (police embarquée, image...) — hors de propos ici.
    }

    cursor = contentEnd + 'endstream'.length;
  }

  return decodedText;
}

describe('reports-pdf.builder', () => {
  it('génère un PDF journalier valide (signature %PDF)', async () => {
    const buffer = await buildDailyReportPdf(dailyReport);
    expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(100);
  });

  it('génère un PDF mensuel valide (signature %PDF)', async () => {
    const buffer = await buildMonthlyReportPdf(monthlyReport);
    expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(100);
  });

  it('ne plante pas pour une journée sans activité (zéros réels)', async () => {
    const buffer = await buildDailyReportPdf({
      ...dailyReport,
      hasActivity: false,
      totalRevenue: 0,
      salesCount: 0,
      topProducts: [],
      stockAlerts: [],
    });
    expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
  });

  describe('formatXaf (chaîne JS produite avant tout rendu PDF)', () => {
    it("n'émet jamais le séparateur de milliers U+202F de toLocaleString('fr-FR')", () => {
      for (const amount of [1000, 66500, 1000000, -12500, 0]) {
        expect(formatXaf(amount)).not.toContain(' ');
      }
    });

    it('regroupe par 3 chiffres avec une espace ASCII normale (U+0020)', () => {
      expect(formatXaf(1000)).toBe('1 000 FCFA');
      expect(formatXaf(66500)).toBe('66 500 FCFA');
      expect(formatXaf(1000000)).toBe('1 000 000 FCFA');
      expect(formatXaf(-12500)).toBe('-12 500 FCFA');
      expect(formatXaf(0)).toBe('0 FCFA');
    });
  });

  describe('texte réellement extrait du PDF (pas seulement la signature %PDF)', () => {
    it('affiche les montants à 4, 5 et 6 chiffres avec un espace normal, sans caractère "/" parasite — rapport journalier', async () => {
      const buffer = await buildDailyReportPdf(dailyReport);
      const text = extractPdfRenderedText(buffer);

      // 66 500 FCFA (chiffre d'affaires) et 1 000 FCFA (marge du produit).
      expect(text).toContain('66 500 FCFA');
      expect(text).toContain('1 000 FCFA');
      expect(text).not.toMatch(/\/\d+ FCFA/); // aucun "/" juste avant un montant (la panne U+202F observée par le QA)
    });

    it('affiche un montant à 7 chiffres (1 000 000 FCFA) correctement — rapport mensuel', async () => {
      const buffer = await buildMonthlyReportPdf(monthlyReport);
      const text = extractPdfRenderedText(buffer);

      expect(text).toContain('1 000 000 FCFA');
      expect(text).not.toMatch(/\/\d+ FCFA/);
    });

    it('conserve les accents français (aucune casse d’encodage)', async () => {
      const buffer = await buildDailyReportPdf(dailyReport);
      const text = extractPdfRenderedText(buffer);

      expect(text).toContain('Indicateurs financiers');
      expect(text).toContain("Chiffre d'affaires");
      expect(text).toContain('Dépenses');
      expect(text).toContain('Bénéfice net');
      expect(text).toContain('Alertes stock');
    });

    it('affiche un montant négatif correctement (signe conservé, pas de "/")', async () => {
      const buffer = await buildDailyReportPdf({ ...dailyReport, netProfit: -12500 });
      const text = extractPdfRenderedText(buffer);

      expect(text).toContain('-12 500 FCFA');
    });

    it('affiche un montant nul comme "0 FCFA" (sans séparateur, zéro réel)', async () => {
      const buffer = await buildDailyReportPdf({ ...dailyReport, totalExpenses: 0 });
      const text = extractPdfRenderedText(buffer);

      expect(text).toContain('0 FCFA');
    });
  });
});
