import type { CrossSellPairDto, CustomerInsightDto, ProductToPushDto } from '@copilote/shared';
import { Tabs, Text } from '@mantine/core';
import { IconArrowsExchange, IconRocket, IconUsers } from '@tabler/icons-react';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { useCrossSellOpportunities, useCustomerInsights, useProductsToPush } from '../../hooks/useCommercial';
import { formatCurrency, formatDate } from '../../lib/format';

export function CommercialPage() {
  const { data: productsToPush = [], isLoading: isLoadingPush } = useProductsToPush();
  const { data: customers = [], isLoading: isLoadingCustomers } = useCustomerInsights();
  const { data: crossSell = [], isLoading: isLoadingCrossSell } = useCrossSellOpportunities();

  const pushColumns: DataTableColumn<ProductToPushDto>[] = [
    { key: 'productName', label: 'Produit', render: (p) => p.productName },
    { key: 'marginPerUnit', label: 'Marge / unité', textAlign: 'right', render: (p) => formatCurrency(p.marginPerUnit) },
    { key: 'stockQuantity', label: 'Stock', textAlign: 'right', render: (p) => p.stockQuantity },
    {
      key: 'description',
      label: 'Détail',
      render: (p) => (
        <Text size="sm" c="dimmed">
          {p.description}
        </Text>
      ),
    },
  ];

  const customerColumns: DataTableColumn<CustomerInsightDto>[] = [
    { key: 'customerLabel', label: 'Client', render: (c) => c.customerLabel },
    { key: 'totalSpent', label: 'Dépense totale', textAlign: 'right', render: (c) => formatCurrency(c.totalSpent) },
    { key: 'purchaseCount', label: 'Achats', textAlign: 'right', render: (c) => c.purchaseCount },
    { key: 'lastPurchaseAt', label: 'Dernier achat', render: (c) => formatDate(c.lastPurchaseAt) },
    {
      key: 'daysSinceLastPurchase',
      label: 'Jours depuis',
      textAlign: 'right',
      render: (c) => (
        <Text c={c.daysSinceLastPurchase > 45 ? 'orange' : undefined} fw={c.daysSinceLastPurchase > 45 ? 600 : undefined}>
          {c.daysSinceLastPurchase}
        </Text>
      ),
    },
  ];

  const crossSellColumns: DataTableColumn<CrossSellPairDto>[] = [
    { key: 'productAName', label: 'Produit A', render: (p) => p.productAName },
    { key: 'productBName', label: 'Produit B', render: (p) => p.productBName },
    { key: 'coOccurrenceCount', label: 'Co-achats', textAlign: 'right', render: (p) => p.coOccurrenceCount },
  ];

  return (
    <>
      <PageHeader title="Commercial" description="Produits à pousser, clients et ventes croisées" />

      <Tabs defaultValue="push">
        <Tabs.List>
          <Tabs.Tab value="push" leftSection={<IconRocket size={16} />}>
            Produits à pousser
          </Tabs.Tab>
          <Tabs.Tab value="customers" leftSection={<IconUsers size={16} />}>
            Meilleurs clients
          </Tabs.Tab>
          <Tabs.Tab value="cross-sell" leftSection={<IconArrowsExchange size={16} />}>
            Ventes croisées
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="push" pt="md">
          <Text size="sm" c="dimmed" mb="sm">
            Produits rentables, en stock, sans vente sur les 30 derniers jours.
          </Text>
          <DataTable
            columns={pushColumns}
            rows={productsToPush}
            rowKey={(p) => p.productId}
            isLoading={isLoadingPush}
            emptyMessage="Aucune opportunité identifiée pour le moment."
          />
        </Tabs.Panel>

        <Tabs.Panel value="customers" pt="md">
          <Text size="sm" c="dimmed" mb="sm">
            Clients identifiés par téléphone ou nom renseigné à la vente, triés par dépense totale.
          </Text>
          <DataTable
            columns={customerColumns}
            rows={customers}
            rowKey={(c) => c.customerLabel}
            isLoading={isLoadingCustomers}
            emptyMessage="Aucun client identifié (nom ou téléphone renseigné) pour le moment."
          />
        </Tabs.Panel>

        <Tabs.Panel value="cross-sell" pt="md">
          <Text size="sm" c="dimmed" mb="sm">
            Paires de produits achetées ensemble au moins 2 fois sur les 90 derniers jours.
          </Text>
          <DataTable
            columns={crossSellColumns}
            rows={crossSell}
            rowKey={(p) => `${p.productAId}-${p.productBId}`}
            isLoading={isLoadingCrossSell}
            emptyMessage="Pas encore assez de données pour détecter des ventes croisées."
          />
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
