import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportProductRowDto, ImportProductsDto } from './dto/import-products.dto';
import { ProductsImportService } from './products-import.service';

function row(partial: Partial<ImportProductRowDto> & { line: number }): ImportProductRowDto {
  return Object.assign(new ImportProductRowDto(), partial);
}

describe('ProductsImportService', () => {
  let service: ProductsImportService;
  let prisma: {
    product: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let txCreate: jest.Mock;

  const organizationId = 'org-1';

  beforeEach(() => {
    txCreate = jest.fn().mockResolvedValue({});
    prisma = {
      product: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<void>) =>
        callback({ product: { create: txCreate } }),
      ),
    };
    service = new ProductsImportService(prisma as unknown as PrismaService);
  });

  function importRows(rows: ImportProductRowDto[]) {
    const dto = new ImportProductsDto();
    dto.rows = rows;
    return service.import(organizationId, dto);
  }

  it('importe toutes les lignes valides et crée un produit par ligne', async () => {
    const result = await importRows([
      row({ line: 2, name: 'Riz 25kg', sku: 'RIZ-25KG', purchasePrice: '12000', salePrice: '15000', initialStock: '20' }),
      row({ line: 3, name: 'Huile 5L', sku: 'HUILE-5L', purchasePrice: '3500', salePrice: '4500' }),
    ]);

    expect(result.importedCount).toBe(2);
    expect(result.rejectedCount).toBe(0);
    expect(result.errors).toEqual([]);
    expect(txCreate).toHaveBeenCalledTimes(2);
    expect(txCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId,
        sku: 'RIZ-25KG',
        stockQuantity: 20,
      }),
    });
  });

  it("utilise 0 comme stock initial par défaut quand il n'est pas fourni", async () => {
    await importRows([row({ line: 2, name: 'Savon', sku: 'SAVON-01', purchasePrice: '200', salePrice: '350' })]);

    expect(txCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ stockQuantity: 0 }),
    });
  });

  it('rejette une ligne sans désignation avec un message clair et la bonne ligne', async () => {
    const result = await importRows([
      row({ line: 5, name: '', sku: 'X-1', purchasePrice: '100', salePrice: '200' }),
    ]);

    expect(result.importedCount).toBe(0);
    expect(result.rejectedCount).toBe(1);
    expect(result.errors).toEqual([{ line: 5, message: 'La désignation du produit est manquante.' }]);
    expect(txCreate).not.toHaveBeenCalled();
  });

  it("rejette une ligne avec un prix d'achat non numérique", async () => {
    const result = await importRows([
      row({ line: 4, name: 'Farine', sku: 'FARINE-1', purchasePrice: 'abc', salePrice: '9500' }),
    ]);

    expect(result.errors).toEqual([{ line: 4, message: "Le prix d'achat n'est pas un nombre valide." }]);
  });

  it('rejette une ligne avec un prix de vente négatif ou nul', async () => {
    const result = await importRows([
      row({ line: 4, name: 'Farine', sku: 'FARINE-1', purchasePrice: '8000', salePrice: '0' }),
    ]);

    expect(result.errors).toEqual([{ line: 4, message: 'Le prix de vente n’est pas un nombre valide.' }]);
  });

  it('rejette un seuil minimum non entier', async () => {
    const result = await importRows([
      row({ line: 4, name: 'Farine', sku: 'FARINE-1', purchasePrice: '8000', salePrice: '9500', minStock: '2.5' }),
    ]);

    expect(result.errors).toEqual([{ line: 4, message: 'Le seuil minimum n’est pas un nombre entier valide.' }]);
  });

  it('détecte un SKU en double au sein du même fichier et conserve la première occurrence', async () => {
    const result = await importRows([
      row({ line: 2, name: 'Riz 25kg', sku: 'RIZ-25KG', purchasePrice: '12000', salePrice: '15000' }),
      row({ line: 7, name: 'Riz 25kg (bis)', sku: 'RIZ-25KG', purchasePrice: '12500', salePrice: '15500' }),
    ]);

    expect(result.importedCount).toBe(1);
    expect(result.rejectedCount).toBe(1);
    expect(result.errors).toEqual([
      { line: 7, message: 'Le SKU "RIZ-25KG" apparaît plusieurs fois dans le fichier (déjà utilisé à la ligne 2).' },
    ]);
    expect(txCreate).toHaveBeenCalledTimes(1);
  });

  it('rejette un SKU déjà utilisé par un produit existant de la même organisation', async () => {
    prisma.product.findMany.mockResolvedValue([{ sku: 'RIZ-25KG' }]);

    const result = await importRows([
      row({ line: 2, name: 'Riz 25kg', sku: 'RIZ-25KG', purchasePrice: '12000', salePrice: '15000' }),
    ]);

    expect(result.importedCount).toBe(0);
    expect(result.errors).toEqual([
      { line: 2, message: 'Le SKU "RIZ-25KG" est déjà utilisé par un produit existant.' },
    ]);
    expect(txCreate).not.toHaveBeenCalled();
  });

  it('ne consulte la base et ne crée rien si toutes les lignes sont invalides', async () => {
    const result = await importRows([row({ line: 2, name: '', sku: '', purchasePrice: '', salePrice: '' })]);

    expect(result.importedCount).toBe(0);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejette un fichier dépassant la limite de lignes autorisée', async () => {
    const rows = Array.from({ length: 5001 }, (_, i) =>
      row({ line: i + 2, name: `P${i}`, sku: `SKU-${i}`, purchasePrice: '100', salePrice: '200' }),
    );

    await expect(importRows(rows)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rapporte un échec clair et n'importe rien si la transaction échoue de façon inattendue", async () => {
    prisma.$transaction.mockRejectedValue(new Error('DB down'));

    const result = await importRows([
      row({ line: 2, name: 'Riz 25kg', sku: 'RIZ-25KG', purchasePrice: '12000', salePrice: '15000' }),
    ]);

    expect(result.importedCount).toBe(0);
    expect(result.rejectedCount).toBe(1);
    expect(result.errors).toEqual([
      {
        line: 0,
        message: "Une erreur inattendue est survenue pendant l'enregistrement : aucun produit n'a été importé. Réessayez.",
      },
    ]);
  });
});
