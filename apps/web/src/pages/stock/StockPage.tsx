import type { ProductDto, StockMovementDto } from '@copilote/shared';
import { Badge, Button, Tabs, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconAlertTriangle, IconHistory, IconPlus } from '@tabler/icons-react';
import { useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { hasRole, STOCK_MUTATION_ROLES } from '../../auth/roles';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { useProducts } from '../../hooks/useProducts';
import { useStockAlerts, useStockMovements } from '../../hooks/useStock';
import { formatDate } from '../../lib/format';
import { StockMovementFormModal } from './StockMovementFormModal';

const MOVEMENT_TYPE_LABELS: Record<StockMovementDto['type'], { label: string; color: string }> = {
  IN: { label: 'Entrée', color: 'green' },
  OUT: { label: 'Sortie', color: 'red' },
  ADJUSTMENT: { label: 'Ajustement', color: 'blue' },
};

export function StockPage() {
  const { user } = useAuth();
  const { data: products = [] } = useProducts();
  const { data: movements = [], isLoading: isLoadingMovements } = useStockMovements();
  const { data: alerts = [], isLoading: isLoadingAlerts } = useStockAlerts();
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const canManage = hasRole(user, STOCK_MUTATION_ROLES);

  const productNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of products) {
      map.set(product.id, product.name);
    }
    return map;
  }, [products]);

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
    {
      key: 'newQuantity',
      label: 'Stock après',
      textAlign: 'right',
      render: (m) => m.newQuantity,
    },
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
    { key: 'minStock', label: 'Seuil minimum', textAlign: 'right', render: (p) => p.minStock },
  ];

  return (
    <>
      <PageHeader
        title="Stock"
        description="Mouvements et alertes de rupture"
        action={
          canManage && (
            <Button leftSection={<IconPlus size={16} />} onClick={openModal}>
              Enregistrer un mouvement
            </Button>
          )
        }
      />

      <Tabs defaultValue="movements">
        <Tabs.List>
          <Tabs.Tab value="movements" leftSection={<IconHistory size={16} />}>
            Mouvements
          </Tabs.Tab>
          <Tabs.Tab value="alerts" leftSection={<IconAlertTriangle size={16} />}>
            Alertes {alerts.length > 0 && `(${alerts.length})`}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="movements" pt="md">
          <DataTable
            columns={movementColumns}
            rows={movements}
            rowKey={(m) => m.id}
            isLoading={isLoadingMovements}
            emptyMessage="Aucun mouvement de stock enregistré."
          />
        </Tabs.Panel>

        <Tabs.Panel value="alerts" pt="md">
          <DataTable
            columns={alertColumns}
            rows={alerts}
            rowKey={(p) => p.id}
            isLoading={isLoadingAlerts}
            emptyMessage="Aucun produit sous son seuil minimum."
          />
        </Tabs.Panel>
      </Tabs>

      <StockMovementFormModal opened={modalOpened} onClose={closeModal} />
    </>
  );
}
