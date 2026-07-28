import { toWhatsAppText } from './markdown-to-whatsapp';

describe('toWhatsAppText', () => {
  it('convertit les titres Markdown en texte en gras WhatsApp', () => {
    expect(toWhatsAppText('## Résumé')).toBe('*Résumé*');
  });

  it('convertit **gras** Markdown en *gras* WhatsApp', () => {
    expect(toWhatsAppText('Le **bénéfice net** est négatif.')).toBe('Le *bénéfice net* est négatif.');
  });

  it('aplati un tableau Markdown en lignes lisibles', () => {
    const markdown = ['| Produit | Marge |', '|---|---|', '| Riz | 3000 |'].join('\n');
    expect(toWhatsAppText(markdown)).toBe('Produit — Marge\nRiz — 3000');
  });
});
