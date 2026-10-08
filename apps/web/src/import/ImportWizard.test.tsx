import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ImportWizard, type ImportResult, type ImportRowPayload } from './ImportWizard';
import { PRODUCT_IMPORT_FIELDS } from './importFieldDefinitions';

function renderWizard(onImport: (rows: ImportRowPayload[]) => Promise<ImportResult>) {
  return render(
    <MantineProvider>
      <ImportWizard
        fields={PRODUCT_IMPORT_FIELDS}
        entityLabelSingular="produit"
        entityLabelPlural="produits"
        onImport={onImport}
      />
    </MantineProvider>,
  );
}

function uploadCsv(container: HTMLElement, content: string, name = 'produits.csv') {
  const file = new File([content], name, { type: 'text/csv' });
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

describe('ImportWizard', () => {
  it('lit un CSV, suggère le mapping, construit un aperçu correct, exclut les colonnes non gérées et importe', async () => {
    const onImport = vi.fn().mockResolvedValue({ importedCount: 1, rejectedCount: 0, errors: [] });
    const { container } = renderWizard(onImport);

    uploadCsv(
      container,
      'nom,sku,prix_achat,prix_vente,stock_initial,tva\nRiz 25kg,RIZ-25KG,12000,15000,20,19.25\n',
    );

    // Étape mapping : les 4 champs obligatoires sont auto-suggérés, donc
    // rien ne bloque le passage à l'aperçu.
    const previewButton = await screen.findByRole('button', { name: "Voir l'aperçu" });
    expect(previewButton).not.toBeDisabled();
    fireEvent.click(previewButton);

    // Étape aperçu : la colonne "tva" n'a aucun champ UGE correspondant.
    // BUG-IMPORT-001 (cas singulier) : "1 colonne ne sera pas importée", pas "seraont".
    expect(screen.getByText('1 colonne ne sera pas importée : tva')).toBeInTheDocument();
    expect(screen.getByText(/ne correspondent à aucun champ actuellement géré par UGE/)).toBeInTheDocument();
    expect(screen.getByText('RIZ-25KG')).toBeInTheDocument();

    // BUG-IMPORT-002 (cas singulier) : "Importer 1 produit", pas "1 produits".
    expect(screen.getByRole('button', { name: 'Importer 1 produit' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Importer 1 produit' }));

    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
    expect(onImport).toHaveBeenCalledWith([
      expect.objectContaining({
        line: 2,
        name: 'Riz 25kg',
        sku: 'RIZ-25KG',
        purchasePrice: '12000',
        salePrice: '15000',
        initialStock: '20',
      }),
    ]);

    expect(await screen.findByText('Import terminé avec 1 ligne importée.')).toBeInTheDocument();
  });

  it('BUG-IMPORT-001 (cas pluriel) : accorde correctement "ne seront pas importées", jamais "seraont"', async () => {
    const onImport = vi.fn();
    const { container } = renderWizard(onImport);

    uploadCsv(
      container,
      'nom,sku,prix_achat,prix_vente,tva,marge,impot\nRiz 25kg,RIZ-25KG,12000,15000,19.25,3000,500\n',
    );

    fireEvent.click(await screen.findByRole('button', { name: "Voir l'aperçu" }));

    expect(screen.getByText('3 colonnes ne seront pas importées : tva, marge, impot')).toBeInTheDocument();
    expect(screen.queryByText(/seraont/)).not.toBeInTheDocument();
  });

  it("bloque le passage à l'aperçu quand un champ obligatoire n'est associé à aucune colonne", async () => {
    const onImport = vi.fn();
    const { container } = renderWizard(onImport);

    uploadCsv(container, 'A,B,C,D\nValeur,CODE1,100,200\n');

    const previewButton = await screen.findByRole('button', { name: "Voir l'aperçu" });
    expect(previewButton).toBeDisabled();
    expect(screen.getByText(/Champs obligatoires non associés/)).toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();
  });

  it('affiche une erreur claire pour un fichier ne contenant que des en-têtes', async () => {
    const onImport = vi.fn();
    const { container } = renderWizard(onImport);

    uploadCsv(container, 'nom,sku,prix_achat,prix_vente\n');

    expect(
      await screen.findByText('Le fichier ne contient aucune ligne de données (seulement des en-têtes).'),
    ).toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();
  });

  it("revient à l'étape fichier sans rien importer quand on clique sur Annuler", async () => {
    const onImport = vi.fn();
    const { container } = renderWizard(onImport);

    uploadCsv(container, 'nom,sku,prix_achat,prix_vente\nRiz,RIZ-1,100,200\n');

    await screen.findByRole('button', { name: "Voir l'aperçu" });
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(await screen.findByText('Choisir un fichier')).toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();
  });

  it('affiche les lignes rejetées avec leur message quand l’import retourne des erreurs', async () => {
    const onImport = vi.fn().mockResolvedValue({
      importedCount: 1,
      rejectedCount: 1,
      errors: [{ line: 3, message: 'Le SKU "RIZ-1" est déjà utilisé par un produit existant.' }],
    });
    const { container } = renderWizard(onImport);

    uploadCsv(
      container,
      'nom,sku,prix_achat,prix_vente\nRiz 25kg,RIZ-25KG,12000,15000\nRiz 25kg,RIZ-1,12000,15000\n',
    );

    fireEvent.click(await screen.findByRole('button', { name: "Voir l'aperçu" }));
    fireEvent.click(screen.getByRole('button', { name: /Importer 2 produits/ }));

    expect(
      await screen.findByText('- ligne 3 : Le SKU "RIZ-1" est déjà utilisé par un produit existant.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 ligne importée et 1 ligne rejetée/)).toBeInTheDocument();
  });
});
