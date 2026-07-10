import type { SaleDto } from '@copilote/shared';
import { Badge, Divider, Group, Modal, Stack, Table, Text } from '@mantine/core';
import { formatCurrency, formatDate } from '../../lib/format';
import { PAYMENT_METHOD_LABELS } from '../../lib/labels';

interface SaleDetailModalProps {
  sale: SaleDto | null;
  onClose: () => void;
}

export function SaleDetailModal({ sale, onClose }: SaleDetailModalProps) {
  return (
    <Modal opened={!!sale} onClose={onClose} title="Détail de la vente" size="lg">
      {sale && (
        <Stack gap="md">
          <Group justify="space-between">
            <Stack gap={0}>
              <Text size="sm" c="dimmed">
                Client
              </Text>
              <Text>{sale.customerName ?? 'Anonyme'}</Text>
              {sale.customerPhone && (
                <Text size="sm" c="dimmed">
                  {sale.customerPhone}
                </Text>
              )}
            </Stack>
            <Stack gap={0} align="flex-end">
              <Text size="sm" c="dimmed">
                Date
              </Text>
              <Text>{formatDate(sale.createdAt)}</Text>
              <Badge variant="light" mt={4}>
                {PAYMENT_METHOD_LABELS[sale.paymentMethod]}
              </Badge>
            </Stack>
          </Group>

          <Divider />

          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Produit</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Quantité</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Prix unitaire</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sale.items.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.productName}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{item.quantity}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(item.lineTotal)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Divider />

          <Group justify="space-between">
            <Text fw={600}>Total</Text>
            <Text fw={600} size="lg">
              {formatCurrency(sale.totalAmount)}
            </Text>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
