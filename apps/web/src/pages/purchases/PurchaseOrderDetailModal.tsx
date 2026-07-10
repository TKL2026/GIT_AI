import type { PurchaseOrderDto } from '@copilote/shared';
import { Badge, Divider, Group, Modal, Stack, Table, Text } from '@mantine/core';
import { formatCurrency, formatDate } from '../../lib/format';
import { PURCHASE_ORDER_STATUS_COLORS, PURCHASE_ORDER_STATUS_LABELS } from '../../lib/labels';

interface PurchaseOrderDetailModalProps {
  order: PurchaseOrderDto | null;
  onClose: () => void;
}

export function PurchaseOrderDetailModal({ order, onClose }: PurchaseOrderDetailModalProps) {
  return (
    <Modal opened={!!order} onClose={onClose} title="Détail de la commande" size="lg">
      {order && (
        <Stack gap="md">
          <Group justify="space-between">
            <Stack gap={0}>
              <Text size="sm" c="dimmed">
                Fournisseur
              </Text>
              <Text>{order.supplierName}</Text>
            </Stack>
            <Stack gap={0} align="flex-end">
              <Text size="sm" c="dimmed">
                Commandée le
              </Text>
              <Text>{formatDate(order.createdAt)}</Text>
              <Badge color={PURCHASE_ORDER_STATUS_COLORS[order.status]} variant="light" mt={4}>
                {PURCHASE_ORDER_STATUS_LABELS[order.status]}
              </Badge>
            </Stack>
          </Group>

          {order.receivedAt && (
            <Text size="sm" c="dimmed">
              Reçue le {formatDate(order.receivedAt)}
            </Text>
          )}

          <Divider />

          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Produit</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Quantité</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Coût unitaire</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {order.items.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.productName}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{item.quantity}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(item.unitCost)}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(item.lineTotal)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Divider />

          <Group justify="space-between">
            <Text fw={600}>Total</Text>
            <Text fw={600} size="lg">
              {formatCurrency(order.totalAmount)}
            </Text>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
