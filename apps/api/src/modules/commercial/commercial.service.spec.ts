import { PrismaService } from '../../prisma/prisma.service';
import { CommercialService } from './commercial.service';

describe('CommercialService', () => {
  const organizationId = 'org-1';

  let prisma: {
    product: { findMany: jest.Mock };
    saleItem: { findMany: jest.Mock };
    sale: { findMany: jest.Mock };
  };
  let commercialService: CommercialService;

  beforeEach(() => {
    prisma = {
      product: { findMany: jest.fn().mockResolvedValue([]) },
      saleItem: { findMany: jest.fn().mockResolvedValue([]) },
      sale: { findMany: jest.fn().mockResolvedValue([]) },
    };
    commercialService = new CommercialService(prisma as unknown as PrismaService);
  });

  describe('getProductsToPush', () => {
    it('détecte un produit rentable, en stock, sans vente récente', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Riz 25kg', salePrice: 15000, purchasePrice: 12000, stockQuantity: 10 },
      ]);
      prisma.saleItem.findMany.mockResolvedValue([]);

      const [result] = await commercialService.getProductsToPush(organizationId);

      expect(result.productId).toBe('p1');
      expect(result.marginPerUnit).toBe(3000);
    });

    it('exclut un produit vendu récemment', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Riz 25kg', salePrice: 15000, purchasePrice: 12000, stockQuantity: 10 },
      ]);
      prisma.saleItem.findMany.mockResolvedValue([{ productId: 'p1' }]);

      const results = await commercialService.getProductsToPush(organizationId);

      expect(results).toHaveLength(0);
    });

    it('exclut un produit sans marge ou sans stock', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Sans marge', salePrice: 10000, purchasePrice: 10000, stockQuantity: 10 },
        { id: 'p2', name: 'Sans stock', salePrice: 15000, purchasePrice: 10000, stockQuantity: 0 },
      ]);
      prisma.saleItem.findMany.mockResolvedValue([]);

      const results = await commercialService.getProductsToPush(organizationId);

      expect(results).toHaveLength(0);
    });

    it('trie par marge décroissante', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: 'low', name: 'Basse marge', salePrice: 11000, purchasePrice: 10000, stockQuantity: 5 },
        { id: 'high', name: 'Haute marge', salePrice: 20000, purchasePrice: 10000, stockQuantity: 5 },
      ]);
      prisma.saleItem.findMany.mockResolvedValue([]);

      const results = await commercialService.getProductsToPush(organizationId);

      expect(results.map((r) => r.productId)).toEqual(['high', 'low']);
    });
  });

  describe('getCustomerInsights', () => {
    it('regroupe par téléphone en priorité, agrège dépense et fréquence', async () => {
      prisma.sale.findMany.mockResolvedValue([
        { customerName: 'Awa', customerPhone: '+225000', totalAmount: 10000, createdAt: new Date('2026-07-01') },
        { customerName: 'Awa D.', customerPhone: '+225000', totalAmount: 5000, createdAt: new Date('2026-07-05') },
      ]);

      const [result] = await commercialService.getCustomerInsights(organizationId);

      expect(result.customerLabel).toBe('+225000');
      expect(result.totalSpent).toBe(15000);
      expect(result.purchaseCount).toBe(2);
      expect(result.lastPurchaseAt).toBe(new Date('2026-07-05').toISOString());
    });

    it('ignore les ventes anonymes (sans nom ni téléphone)', async () => {
      prisma.sale.findMany.mockResolvedValue([
        { customerName: null, customerPhone: null, totalAmount: 10000, createdAt: new Date() },
      ]);

      const results = await commercialService.getCustomerInsights(organizationId);

      expect(results).toHaveLength(0);
    });

    it('trie par dépense décroissante et respecte la limite', async () => {
      prisma.sale.findMany.mockResolvedValue([
        { customerName: 'Petit client', customerPhone: null, totalAmount: 1000, createdAt: new Date() },
        { customerName: 'Gros client', customerPhone: null, totalAmount: 100000, createdAt: new Date() },
      ]);

      const results = await commercialService.getCustomerInsights(organizationId, 1);

      expect(results).toHaveLength(1);
      expect(results[0].customerLabel).toBe('Gros client');
    });
  });

  describe('getCrossSellOpportunities', () => {
    it('détecte une paire de produits co-achetée au moins 2 fois', async () => {
      prisma.saleItem.findMany.mockResolvedValue([
        { saleId: 's1', productId: 'p1', productName: 'Riz' },
        { saleId: 's1', productId: 'p2', productName: 'Huile' },
        { saleId: 's2', productId: 'p1', productName: 'Riz' },
        { saleId: 's2', productId: 'p2', productName: 'Huile' },
      ]);

      const [pair] = await commercialService.getCrossSellOpportunities(organizationId);

      expect(pair.coOccurrenceCount).toBe(2);
      expect([pair.productAId, pair.productBId].sort()).toEqual(['p1', 'p2']);
    });

    it('ignore une co-occurrence unique', async () => {
      prisma.saleItem.findMany.mockResolvedValue([
        { saleId: 's1', productId: 'p1', productName: 'Riz' },
        { saleId: 's1', productId: 'p2', productName: 'Huile' },
      ]);

      const results = await commercialService.getCrossSellOpportunities(organizationId);

      expect(results).toHaveLength(0);
    });

    it('ignore les ventes à un seul produit', async () => {
      prisma.saleItem.findMany.mockResolvedValue([
        { saleId: 's1', productId: 'p1', productName: 'Riz' },
      ]);

      const results = await commercialService.getCrossSellOpportunities(organizationId);

      expect(results).toHaveLength(0);
    });

    it('trie par occurrence décroissante et respecte la limite', async () => {
      prisma.saleItem.findMany.mockResolvedValue([
        // p1+p2 co-achetés 3 fois
        { saleId: 's1', productId: 'p1', productName: 'Riz' },
        { saleId: 's1', productId: 'p2', productName: 'Huile' },
        { saleId: 's2', productId: 'p1', productName: 'Riz' },
        { saleId: 's2', productId: 'p2', productName: 'Huile' },
        { saleId: 's3', productId: 'p1', productName: 'Riz' },
        { saleId: 's3', productId: 'p2', productName: 'Huile' },
        // p3+p4 co-achetés 2 fois
        { saleId: 's4', productId: 'p3', productName: 'Sel' },
        { saleId: 's4', productId: 'p4', productName: 'Sucre' },
        { saleId: 's5', productId: 'p3', productName: 'Sel' },
        { saleId: 's5', productId: 'p4', productName: 'Sucre' },
      ]);

      const results = await commercialService.getCrossSellOpportunities(organizationId, 1);

      expect(results).toHaveLength(1);
      expect(results[0].coOccurrenceCount).toBe(3);
    });
  });
});
