import { Badge, Group, Pagination, Select, Stack, Table, Text } from '@mantine/core';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SearchInput } from '../../components/SearchInput';
import { SUBSCRIPTION_STATUS_COLORS, SUBSCRIPTION_STATUS_LABELS } from '../../lib/labels';
import { useAdminOrganizations } from '../hooks/useAdminOrganizations';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = Object.entries(SUBSCRIPTION_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export function AdminOrganizationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const { data, isLoading } = useAdminOrganizations({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status: status ?? undefined,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <Stack gap="lg">
      <PageHeader title="Organisations" description="Toutes les organisations clientes de la plateforme" />

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
          placeholder="Statut d'abonnement"
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
              <Table.Th>Entreprise</Table.Th>
              <Table.Th>Pays</Table.Th>
              <Table.Th>Secteur</Table.Th>
              <Table.Th>Utilisateurs</Table.Th>
              <Table.Th>Plan</Table.Th>
              <Table.Th>Statut</Table.Th>
              <Table.Th>Créée le</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data?.data.map((org) => (
              <Table.Tr
                key={org.id}
                onClick={() => navigate(`/admin/organizations/${org.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <Table.Td>
                  <Group gap={6}>
                    <Text size="sm" fw={500}>
                      {org.name}
                    </Text>
                    {org.suspended && (
                      <Badge color="error" size="xs">
                        Suspendue
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>{org.country ?? '—'}</Table.Td>
                <Table.Td>{org.industry ?? '—'}</Table.Td>
                <Table.Td>{org.userCount}</Table.Td>
                <Table.Td>{org.planName ?? '—'}</Table.Td>
                <Table.Td>
                  {org.subscriptionStatus ? (
                    <Badge color={SUBSCRIPTION_STATUS_COLORS[org.subscriptionStatus]} variant="light">
                      {SUBSCRIPTION_STATUS_LABELS[org.subscriptionStatus]}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </Table.Td>
                <Table.Td>{new Date(org.createdAt).toLocaleDateString('fr-FR')}</Table.Td>
              </Table.Tr>
            ))}
            {!isLoading && data?.data.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    Aucune organisation ne correspond à ces critères.
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
