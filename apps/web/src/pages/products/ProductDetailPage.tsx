import { StockMovementType, type SaleItemDto, type StockMovementDto } from '@copilote/shared';
import { Badge, Button, Card, Center, Group, Loader, SimpleGrid, Text, Title } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { DetailPageLayout } from '../../components/DetailPageLayout';
import { useCopilotChat } from '../../hooks/useCopilot';
import { useProducts } from '../../hooks/useProducts';
import { useSales } from '../../hooks/useSales';
import { useStockMovements } from '../../hooks/useStock';
import { formatCurrency, formatDate } from '../../lib/format';

const MOVEMENT_LABELS: Record<StockMovementType, { label: string; color: string }> = {
  [StockMovementType.IN]: { label: 'Entrée', color: 'emerald' },
  [StockMovementType.OUT]: { label: 'Sortie', color: 'error' },
  [StockMovementType.ADJUSTMENT]: { label: 'Ajustement', color: 'warning' },
};

interface SaleLine {
  saleId: string;
  createdAt: string;
  customerName: string | null;
  item: SaleItemDto;
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: products = [], isLoading: isProductLoading } = useProducts();
  const { data: movements = [], isLoading: isMovementsLoading } = useStockMovements(id);
  const { data: sales = [], isLoading: isSalesLoading } = useSales();
  const chat = useCopilotChat();

  const product = products.find((p) => p.id === id);

  const saleLines = useMemo<SaleLine[]>(
    () =>
      sales
        .flatMap((s) =>
          s.items
            .filter((item) => item.productId === id)
            .map((item) => ({ saleId: s.id, createdAt: s.createdAt, customerName: s.customerName, item })),
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [sales, id],
  );

  const movementColumns: DataTableColumn<StockMovementDto>[] = [
    { key: 'date', label: 'Date', render: (m) => formatDate(m.createdAt) },
    {
      key: 'type',
      label: 'Type',
      render: (m) => <Badge color={MOVEMENT_LABELS[m.type].color} variant="light">{MOVEMENT_LABELS[m.type].label}</Badge>,
    },
    { key: 'quantity', label: 'Quantité', textAlign: 'right', render: (m) => m.quantity },
    {
      key: 'change',
      label: 'Stock avant → après',
      textAlign: 'right',
      render: (m) => `${m.previousQuantity} → ${m.newQuantity}`,
    },
    { key: 'reason', label: 'Raison', render: (m) => m.reason ?? '—' },
  ];

  const saleColumns: DataTableColumn<SaleLine>[] = [
    { key: 'date', label: 'Date', render: (s) => formatDate(s.createdAt) },
    { key: 'customer', label: 'Client', render: (s) => s.customerName ?? 'Client anonyme' },
    { key: 'quantity', label: 'Quantité', textAlign: 'right', render: (s) => s.item.quantity },
    { key: 'unitPrice', label: 'Prix unitaire', textAlign: 'right', render: (s) => formatCurrency(s.item.unitPrice) },
    { key: 'total', label: 'Total', textAlign: 'right', render: (s) => formatCurrency(s.item.lineTotal) },
  ];

  if (isProductLoading) {
    return (
      <Center py="xl">
        <Loader size="sm" />
      </Center>
    );
  }

  if (!product) {
    return (
      <DetailPageLayout title="Produit introuvable" backTo="/products">
        <Text c="dimmed">Ce produit n'existe pas ou a été supprimé.</Text>
      </DetailPageLayout>
    );
  }

  const isLow = product.minStock !== null && product.stockQuantity <= product.minStock;

  return (
    <DetailPageLayout title={product.name} description={`SKU ${product.sku}`} backTo="/products">
      <Card>
        <Title order={5} mb="md">
          Informations générales
        </Title>
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          <div>
            <Text size="xs" c="dimmed">
              Prix d'achat
            </Text>
            <Text fw={600}>{formatCurrency(product.purchasePrice)}</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Prix de vente
            </Text>
            <Text fw={600}>{formatCurrency(product.salePrice)}</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Marge
            </Text>
            <Text fw={600} c={product.salePrice - product.purchasePrice >= 0 ? 'emerald.7' : 'error.7'}>
              {formatCurrency(product.salePrice - product.purchasePrice)}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Valeur du stock
            </Text>
            <Text fw={600}>{formatCurrency(product.stockQuantity * product.purchasePrice)}</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Stock actuel
            </Text>
            <Group gap="xs">
              <Text fw={600}>{product.stockQuantity}</Text>
              {isLow && (
                <Badge color="error" variant="light" size="sm">
                  Stock bas
                </Badge>
              )}
            </Group>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Seuils (min / max)
            </Text>
            <Text fw={600}>
              {product.minStock ?? '—'} / {product.maxStock ?? '—'}
            </Text>
          </div>
        </SimpleGrid>
      </Card>

      <Card>
        <Title order={5} mb="md">
          Historique des mouvements
        </Title>
        <DataTable
          columns={movementColumns}
          rows={movements}
          rowKey={(m) => m.id}
          isLoading={isMovementsLoading}
          emptyMessage="Aucun mouvement de stock pour ce produit."
          pageSize={5}
        />
      </Card>

      <Card>
        <Title order={5} mb="md">
          Ventes de ce produit
        </Title>
        <DataTable
          columns={saleColumns}
          rows={saleLines}
          rowKey={(s) => `${s.saleId}-${s.item.id}`}
          isLoading={isSalesLoading}
          emptyMessage="Ce produit n'a pas encore été vendu."
          pageSize={5}
        />
      </Card>

      <Card>
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <IconSparkles size={18} color="var(--mantine-color-emerald-6)" />
            <Title order={5}>Analyse Copilot</Title>
          </Group>
          <Button
            variant="light"
            size="xs"
            loading={chat.isPending}
            onClick={() =>
              chat.mutate([
                {
                  role: 'user',
                  content: `Analyse le produit "${product.name}" (SKU ${product.sku}) : sa rentabilité, son niveau de stock, et donne une recommandation courte.`,
                },
              ])
            }
          >
            {chat.data ? 'Actualiser' : 'Analyser'}
          </Button>
        </Group>
        {chat.data ? (
          <ReactMarkdown>{chat.data.message}</ReactMarkdown>
        ) : (
          <Text size="sm" c="dimmed">
            Demandez au copilote une analyse rapide de ce produit.
          </Text>
        )}
      </Card>
    </DetailPageLayout>
  );
}
