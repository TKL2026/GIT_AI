import { describe, expect, it } from 'vitest';
import { buildImportTemplateCsv } from './buildImportTemplateCsv';
import { PRODUCT_IMPORT_FIELDS } from './importFieldDefinitions';

describe('buildImportTemplateCsv', () => {
  it('commence par un BOM UTF-8 pour que Excel affiche correctement les accents', () => {
    const csv = buildImportTemplateCsv(PRODUCT_IMPORT_FIELDS);
    expect(csv.codePointAt(0)).toBe(0xfeff);
  });

  it('contient les libellés des champs, accents compris, juste après le BOM', () => {
    const csv = buildImportTemplateCsv(PRODUCT_IMPORT_FIELDS);
    expect(csv.slice(1)).toContain('Désignation du produit');
    expect(csv.slice(1)).toContain('Référence (SKU)');
  });
});
