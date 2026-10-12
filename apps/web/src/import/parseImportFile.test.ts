import { describe, expect, it } from 'vitest';
import { ImportFileError, parseImportFile } from './parseImportFile';

describe('parseImportFile', () => {
  it('rejette un PDF renommé ou non avec un message clair, avant toute tentative de lecture en CSV', async () => {
    // En-tête PDF réel suivi de contenu binaire — exactement ce qu'un vrai
    // fichier .pdf produit une fois lu comme texte.
    const pdfLikeContent = '%PDF-1.4\n%\x00\x01\x02binary garbage\x00\x00\x00';
    const file = new File([pdfLikeContent], 'document.pdf', { type: 'application/pdf' });

    await expect(parseImportFile(file)).rejects.toMatchObject({
      constructor: ImportFileError,
      message: expect.stringContaining('Format de fichier non supporté'),
    });
  });

  it('rejette toute extension non supportée (docx, png, exe...)', async () => {
    for (const name of ['rapport.docx', 'photo.png', 'script.exe', 'archive.zip']) {
      const file = new File(['peu importe le contenu'], name);
      await expect(parseImportFile(file)).rejects.toBeInstanceOf(ImportFileError);
    }
  });

  it('rejette un contenu binaire même renommé en .csv (contournement par extension)', async () => {
    const binaryDisguisedAsCsv = '%PDF-1.4\n%\x00\x01\x02\x03\x04\x05\x06\x07binary\x00\x00\x00\x00';
    const file = new File([binaryDisguisedAsCsv], 'produits.csv', { type: 'text/csv' });

    await expect(parseImportFile(file)).rejects.toMatchObject({
      constructor: ImportFileError,
      message: expect.stringContaining('contenu binaire détecté'),
    });
  });

  it('accepte toujours un vrai CSV valide (non-régression)', async () => {
    const csv = 'nom,sku,prix_achat,prix_vente\nRiz 25kg,RIZ-25KG,12000,15000\n';
    const file = new File([csv], 'produits.csv', { type: 'text/csv' });

    const result = await parseImportFile(file);
    expect(result.headers).toEqual(['nom', 'sku', 'prix_achat', 'prix_vente']);
    expect(result.rows).toHaveLength(1);
  });
});
