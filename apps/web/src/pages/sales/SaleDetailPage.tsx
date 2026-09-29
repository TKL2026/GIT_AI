import type { SaleItemDto } from '@copilote/shared';
import { Badge, Button, Card, Center, Group, Loader, SimpleGrid, Text, Title } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import { useParams } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { DetailPageLayout } from '../../components/DetailPageLayout';
import { useCopilotChat } from '../../hooks/useCopilot';
import { useSales } from '../../hooks/useSales';
import { formatCurrency, formatDate } from '../../lib/format';
import { PAYMENT_METHOD_LABELS } from '../../lib/labels';

export function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: sales = [], isLoading } = useSales();
  const chat = useCopilotChat();

  const sale = sales.find((s) => s.id === id);

  const itemColumns: DataTableColumn<SaleItemDto>[] = [
    { key: 'product', label: 'Produit', render: (i) => i.productName },
    { key: 'quantity', label: 'Quantité', textAlign: 'right', render: (i) => i.quantity },
    { key: 'unitPrice', label: 'Prix unitaire', textAlign: 'right', render: (i) => formatCurrency(i.unitPrice) },
    { key: 'total', label: 'Total', textAlign: 'right', render: (i) => formatCurrency(i.lineTotal) },
  ];

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader size="sm" />
      </Center>
    );
  }

  if (!sale) {
    return (
      <DetailPageLayout title="Vente introuvable" backTo="/sales">
        <Text c="dimmed">Cette vente n'existe pas ou a été supprimée.</Text>
      </DetailPageLayout>
    );
  }

  return (
    <DetailPageLayout
      title={sale.customerName ?? 'Client anonyme'}
      description={formatDate(sale.createdAt)}
      backTo="/sales"
    >
      <Card>
        <Title order={5} mb="md">
          Informations générales
        </Title>
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          <div>
            <Text size="xs" c="dimmed">
              Client
            </Text>
            <Text fw={600}>{sale.customerName ?? 'Anonyme'}</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Téléphone
            </Text>
            <Text fw={600}>{sale.customerPhone ?? '—'}</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Paiement
            </Text>
            <Badge variant="light">{PAYMENT_METHOD_LABELS[sale.paymentMethod]}</Badge>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Total
            </Text>
            <Text fw={700} size="lg">
              {formatCurrency(sale.totalAmount)}
            </Text>
          </div>
        </SimpleGrid>
      </Card>

      <Card>
        <Title order={5} mb="md">
          Articles
        </Title>
        <DataTable columns={itemColumns} rows={sale.items} rowKey={(i) => i.id} emptyMessage="Aucun article." />
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
                  content: `Analyse cette vente précise : client ${sale.customerName ?? 'anonyme'}, produits vendus : ${sale.items.map((i) => `${i.quantity}x ${i.productName} à ${i.unitPrice} FCFA`).join(', ')}, total ${sale.totalAmount} FCFA, payé par ${PAYMENT_METHOD_LABELS[sale.paymentMethod]}, le ${formatDate(sale.createdAt)}. Est-ce une bonne vente (marge, panier) ? Vois-tu une opportunité (vente croisée, relance client) ?`,
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
            Demandez au copilote une analyse rapide de cette vente.
          </Text>
        )}
      </Card>
    </DetailPageLayout>
  );
}
