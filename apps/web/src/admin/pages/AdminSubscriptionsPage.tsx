import { Badge, Group, Pagination, Select, Stack, Table, Text } from '@mantine/core';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SearchInput } from '../../components/SearchInput';
import { formatDate } from '../../lib/format';
import { SUBSCRIPTION_STATUS_COLORS, SUBSCRIPTION_STATUS_LABELS } from '../../lib/labels';
import { useAdminSubscriptions } from '../hooks/useAdminSubscriptions';

const PAGE_SIZE = 20;
const STATUS_OPTIONS = Object.entries(SUBSCRIPTION_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export function AdminSubscriptionsPage() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | null>(searchParams.get('status'));

  const { data, isLoading } = useAdminSubscriptions({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status: status ?? undefined,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <Stack gap="lg">
      <PageHeader title="Abonnements" description="Tous les abonnements, toutes organisations confondues" />

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

      <Table.ScrollContainer minWidth={700}>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Organisation</Table.Th>
              <Table.Th>Plan</Table.Th>
              <Table.Th>Statut</Table.Th>
              <Table.Th>Débuté le</Table.Th>
              <Table.Th>Fin de période</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data?.data.map((sub) => (
              <Table.Tr key={sub.id}>
                <Table.Td>
                  <Text component={Link} to={`/admin/organizations/${sub.organizationId}`} size="sm" fw={500}>
                    {sub.organizationName}
                  </Text>
                </Table.Td>
                <Table.Td>{sub.planName ?? '—'}</Table.Td>
                <Table.Td>
                  <Badge color={SUBSCRIPTION_STATUS_COLORS[sub.status]} variant="light">
                    {SUBSCRIPTION_STATUS_LABELS[sub.status]}
                  </Badge>
                </Table.Td>
                <Table.Td>{sub.startedAt ? formatDate(sub.startedAt) : '—'}</Table.Td>
                <Table.Td>{sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : '—'}</Table.Td>
              </Table.Tr>
            ))}
            {!isLoading && data?.data.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    Aucun abonnement ne correspond à ces critères.
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
