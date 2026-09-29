import { describe, expect, it } from 'vitest';
import { parseProductsCsv } from './parseProductsCsv';

describe('parseProductsCsv', () => {
  it('parse un CSV valide avec les colonnes attendues', () => {
    const csv = 'nom,sku,prix_achat,prix_vente,stock_initial\nRiz 25kg,RIZ-25KG,12000,15000,20\nSel 1kg,SEL-1KG,300,500,50';
    const result = parseProductsCsv(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({ line: 2, name: 'Riz 25kg', sku: 'RIZ-25KG', purchasePrice: 12000, salePrice: 15000, initialStock: 20 });
  });

  it('accepte les en-têtes insensibles à la casse et alias anglais', () => {
    const csv = 'Name,SKU,PurchasePrice,SalePrice\nRiz,RIZ-1,1000,1500';
    const result = parseProductsCsv(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows[0]).toMatchObject({ name: 'Riz', sku: 'RIZ-1', purchasePrice: 1000, salePrice: 1500, initialStock: 0 });
  });

  it('utilise 0 comme stock initial par défaut si la colonne est absente', () => {
    const csv = 'nom,sku,prix_achat,prix_vente\nRiz,RIZ-1,1000,1500';
    const result = parseProductsCsv(csv);
    expect(result.rows[0].initialStock).toBe(0);
  });

  it('signale les colonnes obligatoires manquantes sans planter', () => {
    const csv = 'nom,sku\nRiz,RIZ-1';
    const result = parseProductsCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors[0].message).toContain('Colonnes attendues introuvables');
  });

  it('rejette une ligne avec un nom manquant sans bloquer les autres lignes', () => {
    const csv = 'nom,sku,prix_achat,prix_vente\n,RIZ-1,1000,1500\nSel,SEL-1,300,500';
    const result = parseProductsCsv(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe('Sel');
    expect(result.errors).toEqual([{ line: 2, message: 'Nom manquant.' }]);
  });

  it('rejette un prix invalide ou négatif', () => {
    const csv = 'nom,sku,prix_achat,prix_vente\nRiz,RIZ-1,abc,1500\nSel,SEL-1,-5,500';
    const result = parseProductsCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(2);
    expect(result.errors.every((e) => e.message === "Prix d'achat invalide.")).toBe(true);
  });

  it('rejette un stock initial négatif', () => {
    const csv = 'nom,sku,prix_achat,prix_vente,stock_initial\nRiz,RIZ-1,1000,1500,-3';
    const result = parseProductsCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors[0].message).toBe('Stock initial invalide.');
  });

  it('numérote les lignes en tenant compte de la ligne d\'en-tête', () => {
    const csv = 'nom,sku,prix_achat,prix_vente\nA,A1,1,2\nB,B1,1,2\nC,C1,1,2';
    const result = parseProductsCsv(csv);
    expect(result.rows.map((r) => r.line)).toEqual([2, 3, 4]);
  });
});
