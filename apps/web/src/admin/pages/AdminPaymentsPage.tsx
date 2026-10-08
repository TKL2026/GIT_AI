import { Badge, Group, Pagination, Select, Stack, Table, Text } from '@mantine/core';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SearchInput } from '../../components/SearchInput';
import { formatCurrency, formatDate } from '../../lib/format';
import { PAYMENT_TRANSACTION_STATUS_COLORS, PAYMENT_TRANSACTION_STATUS_LABELS } from '../../lib/labels';
import { useAdminPayments } from '../hooks/useAdminPayments';

const PAGE_SIZE = 20;
const STATUS_OPTIONS = Object.entries(PAYMENT_TRANSACTION_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function AdminPaymentsPage() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | null>(searchParams.get('status'));

  const { data, isLoading } = useAdminPayments({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status: status ?? undefined,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <Stack gap="lg">
      <PageHeader title="Paiements" description="Toutes les transactions CamPay, toutes organisations confondues" />

      <Group>
        <SearchInput
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
          placeholder="Rechercher une organisation…"
        />
        <Select
          placeholder="Statut"
          data={STATUS_OPTIONS}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          clearable
          w={220}
        />
      </Group>

      <Table.ScrollContainer minWidth={800}>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Organisation</Table.Th>
              <Table.Th>Plan</Table.Th>
              <Table.Th>Montant</Table.Th>
              <Table.Th>Statut</Table.Th>
              <Table.Th>Référence</Table.Th>
              <Table.Th>Date</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data?.data.map((payment) => (
              <Table.Tr key={payment.id}>
                <Table.Td>
                  <Text component={Link} to={`/admin/organizations/${payment.organizationId}`} size="sm" fw={500}>
                    {payment.organizationName}
                  </Text>
                </Table.Td>
                <Table.Td>{payment.planName}</Table.Td>
                <Table.Td>{formatCurrency(payment.amount)}</Table.Td>
                <Table.Td>
                  <Badge color={PAYMENT_TRANSACTION_STATUS_COLORS[payment.status]} variant="light">
                    {PAYMENT_TRANSACTION_STATUS_LABELS[payment.status]}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed" ff="monospace">
                    {payment.externalReference}
                  </Text>
                </Table.Td>
                <Table.Td>{formatDate(payment.createdAt)}</Table.Td>
              </Table.Tr>
            ))}
            {!isLoading && data?.data.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    Aucun paiement ne correspond à ces critères.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {totalPages > 1 && (
        <Group justify="center">
          <Pagination value={page} onChange={setPage} total={totalPages} />
        </Group>
      )}
    </Stack>
  );
}
