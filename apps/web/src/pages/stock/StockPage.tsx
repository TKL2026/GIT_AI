import type { ProductDto, PurchaseRecommendationDto, StockForecastDto, StockMovementDto } from '@copilote/shared';
import { Badge, Button, Card, Group, SimpleGrid, Tabs, Text, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAlertTriangle,
  IconArrowDownRight,
  IconArrowUpRight,
  IconBoxSeam,
  IconClipboardList,
  IconEye,
  IconHistory,
  IconPackage,
  IconPlus,
  IconTruckDelivery,
  IconWallet,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { hasRole, STOCK_MUTATION_ROLES } from '../../auth/roles';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { KpiCard } from '../../components/KpiCard';
import { PageHeader } from '../../components/PageHeader';
import { SearchInput } from '../../components/SearchInput';
import { useReplenishmentForecast } from '../../hooks/useForecast';
import { usePurchaseRecommendations } from '../../hooks/usePurchasing';
import { useProducts } from '../../hooks/useProducts';
import { useStockAlerts, useStockMovements } from '../../hooks/useStock';
import { formatCurrency, formatDate } from '../../lib/format';
import { STOCK_STATUS_COLORS, STOCK_STATUS_LABELS } from '../../lib/labels';
import { PurchaseOrderFormModal } from '../purchases/PurchaseOrderFormModal';
import { StockMovementFormModal } from './StockMovementFormModal';

const MOVEMENT_TYPE_LABELS: Record<StockMovementDto['type'], { label: string; color: string }> = {
  IN: { label: 'Entrée', color: 'emerald' },
  OUT: { label: 'Sortie', color: 'error' },
  ADJUSTMENT: { label: 'Ajustement', color: 'warning' },
};

interface ReplenishmentRow extends StockForecastDto {
  recommendation?: PurchaseRecommendationDto;
}

export function StockPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const { data: movements = [], isLoading: isLoadingMovements } = useStockMovements();
  const { data: alerts = [], isLoading: isLoadingAlerts } = useStockAlerts();
  const { data: forecast = [], isLoading: isLoadingForecast } = useReplenishmentForecast();
  const { data: recommendations = [] } = usePurchaseRecommendations();
  const [movementModalOpened, { open: openMovementModal, close: closeMovementModal }] = useDisclosure(false);
  const [orderModalOpened, { open: openOrderModal, close: closeOrderModal }] = useDisclosure(false);
  const [prefill, setPrefill] = useState<{ item: { productId: string; quantity: number; unitCost?: number }; supplierId?: string } | null>(null);
  const [inventorySearch, setInventorySearch] = useState('');

  const canManage = hasRole(user, STOCK_MUTATION_ROLES);

  const productNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of products) {
      map.set(product.id, product.name);
    }
    return map;
  }, [products]);

  const stockTotal = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const stockValue = products.reduce((sum, p) => sum + p.stockQuantity * p.purchasePrice, 0);
  const outOfStockCount = products.filter((p) => p.stockStatus === 'out').length;
  const sevenDaysAgo = dayjs().subtract(7, 'day');
  const recentInCount = movements.filter((m) => m.type === 'IN' && dayjs(m.createdAt).isAfter(sevenDaysAgo)).length;
  const recentOutCount = movements.filter((m) => m.type === 'OUT' && dayjs(m.createdAt).isAfter(sevenDaysAgo)).length;

  const filteredInventory = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query),
    );
  }, [products, inventorySearch]);

  const replenishmentRows: ReplenishmentRow[] = useMemo(() => {
    const recommendationByProduct = new Map(recommendations.map((r) => [r.productId, r]));
    return forecast.map((f) => ({ ...f, recommendation: recommendationByProduct.get(f.productId) }));
  }, [forecast, recommendations]);

  function handlePrepareOrder(row: ReplenishmentRow) {
    if (!row.recommendation) return;
    setPrefill({
      item: {
        productId: row.productId,
        quantity: row.recommendation.recommendedQuantity,
        unitCost: row.recommendation.lastUnitCost ?? undefined,
      },
      supplierId: row.recommendation.recommendedSupplierId ?? undefined,
    });
    openOrderModal();
  }

  const inventoryColumns: DataTableColumn<ProductDto>[] = [
    { key: 'name', label: 'Produit', render: (p) => p.name, sortValue: (p) => p.name.toLowerCase() },
    { key: 'sku', label: 'SKU', render: (p) => p.sku },
    { key: 'stockQuantity', label: 'Stock', textAlign: 'right', render: (p) => p.stockQuantity, sortValue: (p) => p.stockQuantity },
    {
      key: 'thresholds',
      label: 'Seuil',
      render: (p) => (
        <Text size="sm" c="dimmed">
          {p.minStock ?? '—'} / {p.maxStock ?? '—'}
        </Text>
      ),
    },
    {
      key: 'stockValue',
      label: 'Valeur stock',
      textAlign: 'right',
      render: (p) => formatCurrency(p.stockQuantity * p.purchasePrice),
      sortValue: (p) => p.stockQuantity * p.purchasePrice,
    },
    {
      key: 'status',
      label: 'État',
      render: (p) => (
        <Badge color={STOCK_STATUS_COLORS[p.stockStatus]} variant="light">
          {STOCK_STATUS_LABELS[p.stockStatus]}
        </Badge>
      ),
    },
  ];

  const movementColumns: DataTableColumn<StockMovementDto>[] = [
    { key: 'createdAt', label: 'Date', render: (m) => formatDate(m.createdAt) },
    { key: 'product', label: 'Produit', render: (m) => productNameById.get(m.productId) ?? m.productId },
    {
      key: 'type',
      label: 'Type',
      render: (m) => (
        <Badge color={MOVEMENT_TYPE_LABELS[m.type].color} variant="light">
          {MOVEMENT_TYPE_LABELS[m.type].label}
        </Badge>
      ),
    },
    {
      key: 'quantity',
      label: 'Quantité',
      textAlign: 'right',
      render: (m) => (m.type === 'ADJUSTMENT' && m.quantity > 0 ? `+${m.quantity}` : m.quantity),
    },
    { key: 'newQuantity', label: 'Stock après', textAlign: 'right', render: (m) => m.newQuantity },
    {
      key: 'reason',
      label: 'Motif',
      render: (m) => (
        <Text size="sm" c="dimmed">
          {m.reason ?? '—'}
        </Text>
      ),
    },
  ];

  const alertColumns: DataTableColumn<ProductDto>[] = [
    { key: 'name', label: 'Produit', render: (p) => p.name },
    { key: 'sku', label: 'SKU', render: (p) => p.sku },
    { key: 'stockQuantity', label: 'Stock actuel', textAlign: 'right', render: (p) => p.stockQuantity },
    { key: 'minStock', label: 'Seuil minimum', textAlign: 'right', render: (p) => p.minStock ?? '—' },
    {
      key: 'actions',
      label: '',
      textAlign: 'right',
      render: (p) => (
        <Button variant="subtle" size="xs" onClick={() => navigate(`/products/${p.id}`)}>
          Voir produit
        </Button>
      ),
    },
  ];

  const replenishmentColumns: DataTableColumn<ReplenishmentRow>[] = [
    { key: 'productName', label: 'Produit', render: (f) => f.productName },
    { key: 'currentStock', label: 'Stock actuel', textAlign: 'right', render: (f) => f.currentStock },
    {
      key: 'averageDailySales',
      label: 'Ventes/jour',
      textAlign: 'right',
      render: (f) => f.averageDailySales.toFixed(2),
    },
    {
      key: 'daysUntilStockout',
      label: 'Risque',
      textAlign: 'right',
      render: (f) =>
        f.daysUntilStockout === null ? (
          <Text size="sm" c="dimmed">
            —
          </Text>
        ) : (
          <Badge color={f.daysUntilStockout < 7 ? 'error' : f.daysUntilStockout < 14 ? 'warning' : 'emerald'} variant="light">
            {f.daysUntilStockout} j
          </Badge>
        ),
    },
    {
      key: 'recommendedReorderQuantity',
      label: 'Qté recommandée',
      textAlign: 'right',
      render: (f) => f.recommendedReorderQuantity ?? '—',
    },
    {
      key: 'supplier',
      label: 'Fournisseur',
      render: (f) =>
        f.recommendation?.recommendedSupplierName ? (
          f.recommendation.recommendedSupplierName
        ) : (
          <Text size="sm" c="dimmed">
            —
          </Text>
        ),
    },
    {
      key: 'lastUnitCost',
      label: 'Dernier coût',
      textAlign: 'right',
      render: (f) => (f.recommendation?.lastUnitCost ? formatCurrency(f.recommendation.lastUnitCost) : '—'),
    },
    {
      key: 'actions',
      label: '',
      textAlign: 'right',
      render: (f) => (
        <Group gap="xs" justify="flex-end" wrap="nowrap">
          <Tooltip label="Voir le produit">
            <Button variant="subtle" size="xs" px="xs" onClick={() => navigate(`/products/${f.productId}`)}>
              <IconEye size={16} />
            </Button>
          </Tooltip>
          {canManage && (f.recommendedReorderQuantity ?? 0) > 0 && (
            <Button variant="light" size="xs" onClick={() => handlePrepareOrder(f)}>
              Préparer commande
            </Button>
          )}
        </Group>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Stock"
        description="Centre de contrôle de l'inventaire"
        action={
          canManage && (
            <Button leftSection={<IconPlus size={16} />} onClick={openMovementModal}>
              Enregistrer un mouvement
            </Button>
          )
        }
      />

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} mb="xl">
        <KpiCard icon={IconPackage} label="Stock total (unités)" value={String(stockTotal)} />
        <KpiCard icon={IconWallet} label="Valeur du stock" value={formatCurrency(stockValue)} />
        <KpiCard icon={IconAlertTriangle} label="Produits critiques" value={String(alerts.length)} />
        <KpiCard icon={IconBoxSeam} label="Ruptures" value={String(outOfStockCount)} />
        <KpiCard icon={IconArrowUpRight} label="Entrées (7 jours)" value={String(recentInCount)} />
        <KpiCard icon={IconArrowDownRight} label="Sorties (7 jours)" value={String(recentOutCount)} />
      </SimpleGrid>

      <Tabs defaultValue="inventory">
        <Tabs.List>
          <Tabs.Tab value="inventory" leftSection={<IconPackage size={16} />}>
            Inventaire
          </Tabs.Tab>
          <Tabs.Tab value="movements" leftSection={<IconHistory size={16} />}>
            Mouvements
          </Tabs.Tab>
          <Tabs.Tab value="alerts" leftSection={<IconAlertTriangle size={16} />}>
            Alertes {alerts.length > 0 && `(${alerts.length})`}
          </Tabs.Tab>
          <Tabs.Tab value="replenishment" leftSection={<IconTruckDelivery size={16} />}>
            Réapprovisionnement
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="inventory" pt="md">
          <SearchInput
            value={inventorySearch}
            onChange={(e) => setInventorySearch(e.currentTarget.value)}
            placeholder="Rechercher par nom ou SKU…"
            mb="md"
          />
          <DataTable
            columns={inventoryColumns}
            rows={filteredInventory}
            rowKey={(p) => p.id}
            emptyMessage="Aucun produit enregistré pour le moment."
            pageSize={10}
            onRowClick={(p) => navigate(`/products/${p.id}`)}
          />
        </Tabs.Panel>

        <Tabs.Panel value="movements" pt="md">
          <DataTable
            columns={movementColumns}
            rows={movements}
            rowKey={(m) => m.id}
            isLoading={isLoadingMovements}
            emptyMessage="Aucun mouvement de stock enregistré."
            pageSize={10}
          />
        </Tabs.Panel>

        <Tabs.Panel value="alerts" pt="md">
          <DataTable
            columns={alertColumns}
            rows={alerts}
            rowKey={(p) => p.id}
            isLoading={isLoadingAlerts}
            emptyMessage="Aucun produit sous son seuil minimum."
            pageSize={10}
          />
        </Tabs.Panel>

        <Tabs.Panel value="replenishment" pt="md">
          <Card mb="md" bg="emerald.0">
            <Group gap="xs">
              <IconClipboardList size={18} color="var(--mantine-color-emerald-7)" />
              <Text size="sm" c="emerald.9">
                Calculé à partir de la vélocité de vente des 30 derniers jours et de l'historique fournisseurs.
                Les produits sans vente récente n'ont pas de prévision.
              </Text>
            </Group>
          </Card>
          <DataTable
            columns={replenishmentColumns}
            rows={replenishmentRows}
            rowKey={(f) => f.productId}
            isLoading={isLoadingForecast}
            emptyMessage="Aucune donnée de prévision disponible."
            pageSize={10}
          />
        </Tabs.Panel>
      </Tabs>

      <StockMovementFormModal opened={movementModalOpened} onClose={closeMovementModal} />
      <PurchaseOrderFormModal
        opened={orderModalOpened}
        onClose={() => {
          closeOrderModal();
          setPrefill(null);
        }}
        initialItem={prefill?.item}
        initialSupplierId={prefill?.supplierId}
      />
    </>
  );
}
