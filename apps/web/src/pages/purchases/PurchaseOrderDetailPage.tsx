import { PurchaseOrderStatus, type PurchaseOrderItemDto } from '@copilote/shared';
import { Badge, Button, Card, Center, Group, Loader, SimpleGrid, Text, Title } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconShoppingCartCancel, IconSparkles, IconTruckDelivery } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { hasRole, STOCK_MUTATION_ROLES } from '../../auth/roles';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { DetailPageLayout } from '../../components/DetailPageLayout';
import { useCopilotChat } from '../../hooks/useCopilot';
import { useCancelPurchaseOrder, usePurchaseOrders, useReceivePurchaseOrder } from '../../hooks/usePurchases';
import { ApiError } from '../../lib/apiClient';
import { formatCurrency, formatDate } from '../../lib/format';
import { PURCHASE_ORDER_STATUS_COLORS, PURCHASE_ORDER_STATUS_LABELS } from '../../lib/labels';

export function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: orders = [], isLoading } = usePurchaseOrders();
  const receiveOrder = useReceivePurchaseOrder();
  const cancelOrder = useCancelPurchaseOrder();
  const chat = useCopilotChat();

  const canManage = hasRole(user, STOCK_MUTATION_ROLES);
  const order = orders.find((o) => o.id === id);

  const itemColumns: DataTableColumn<PurchaseOrderItemDto>[] = [
    { key: 'product', label: 'Produit', render: (i) => i.productName },
    { key: 'quantity', label: 'Quantité', textAlign: 'right', render: (i) => i.quantity },
    { key: 'unitCost', label: 'Coût unitaire', textAlign: 'right', render: (i) => formatCurrency(i.unitCost) },
    { key: 'total', label: 'Total', textAlign: 'right', render: (i) => formatCurrency(i.lineTotal) },
  ];

  async function handleReceive() {
    if (!order) return;
    try {
      await receiveOrder.mutateAsync(order.id);
      notifications.show({ color: 'green', message: 'Commande réceptionnée, stock mis à jour.' });
    } catch (err) {
      notifications.show({
        color: 'red',
        message: err instanceof ApiError ? err.message : 'Impossible de réceptionner la commande.',
      });
    }
  }

  function handleCancel() {
    if (!order) return;
    modals.openConfirmModal({
      title: 'Annuler cette commande ?',
      children: (
        <Text size="sm">
          La commande auprès de <strong>{order.supplierName}</strong> pour un total de{' '}
          <strong>{formatCurrency(order.totalAmount)}</strong> sera annulée. Cette action est irréversible.
        </Text>
      ),
      labels: { confirm: 'Annuler la commande', cancel: 'Garder la commande' },
      confirmProps: { color: 'error' },
      onConfirm: async () => {
        try {
          await cancelOrder.mutateAsync(order.id);
          notifications.show({ color: 'green', message: 'Commande annulée.' });
        } catch (err) {
          notifications.show({
            color: 'red',
            message: err instanceof ApiError ? err.message : "Impossible d'annuler la commande.",
          });
        }
      },
    });
  }

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader size="sm" />
      </Center>
    );
  }

  if (!order) {
    return (
      <DetailPageLayout title="Commande introuvable" backTo="/purchases">
        <Text c="dimmed">Cette commande n'existe pas ou a été supprimée.</Text>
      </DetailPageLayout>
    );
  }

  return (
    <DetailPageLayout
      title={order.supplierName}
      description={formatDate(order.createdAt)}
      backTo="/purchases"
      action={
        canManage &&
        order.status === PurchaseOrderStatus.PENDING && (
          <Group gap="xs">
            <Button
              variant="light"
              color="error"
              leftSection={<IconShoppingCartCancel size={16} />}
              loading={cancelOrder.isPending}
              onClick={handleCancel}
            >
              Annuler
            </Button>
            <Button
              leftSection={<IconTruckDelivery size={16} />}
              loading={receiveOrder.isPending}
              onClick={handleReceive}
            >
              Réceptionner
            </Button>
          </Group>
        )
      }
    >
      <Card>
        <Title order={5} mb="md">
          Informations générales
        </Title>
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          <div>
            <Text size="xs" c="dimmed">
              Fournisseur
            </Text>
            <Text fw={600}>{order.supplierName}</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Statut
            </Text>
            <Badge color={PURCHASE_ORDER_STATUS_COLORS[order.status]} variant="light">
              {PURCHASE_ORDER_STATUS_LABELS[order.status]}
            </Badge>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Commandée le
            </Text>
            <Text fw={600}>{formatDate(order.createdAt)}</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Reçue le
            </Text>
            <Text fw={600}>{order.receivedAt ? formatDate(order.receivedAt) : '—'}</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Total
            </Text>
            <Text fw={700} size="lg">
              {formatCurrency(order.totalAmount)}
            </Text>
          </div>
        </SimpleGrid>
      </Card>

      <Card>
        <Title order={5} mb="md">
          Articles
        </Title>
        <DataTable columns={itemColumns} rows={order.items} rowKey={(i) => i.id} emptyMessage="Aucun article." />
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
                  content: `Analyse cette commande fournisseur : fournisseur ${order.supplierName}, statut ${PURCHASE_ORDER_STATUS_LABELS[order.status]}, produits commandés : ${order.items.map((i) => `${i.quantity}x ${i.productName} à ${i.unitCost} FCFA`).join(', ')}, total ${order.totalAmount} FCFA, commandée le ${formatDate(order.createdAt)}. Ce prix est-il cohérent avec l'historique ? Cette commande est-elle justifiée par les besoins de stock actuels ?`,
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
            Demandez au copilote une analyse rapide de cette commande.
          </Text>
        )}
      </Card>
    </DetailPageLayout>
  );
}
