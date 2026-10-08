import { Badge, Button, Group, Pagination, Stack, Table, Text } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SearchInput } from '../../components/SearchInput';
import { formatDate } from '../../lib/format';
import { useAdminUsers } from '../hooks/useAdminUsers';

const PAGE_SIZE = 20;

export function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const organizationId = searchParams.get('organizationId') ?? undefined;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useAdminUsers({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    organizationId,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const filteredOrgName = data?.data.find((u) => u.organizationId === organizationId)?.organizationName;

  return (
    <Stack gap="lg">
      <PageHeader title="Utilisateurs" description="Tous les utilisateurs, toutes organisations confondues" />

      <Group>
        <SearchInput
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
          placeholder="Rechercher par nom ou email…"
        />
        {organizationId && (
          <Badge
            size="lg"
            variant="light"
            rightSection={
              <IconX
                size={12}
                style={{ cursor: 'pointer' }}
                onClick={() => setSearchParams({})}
                aria-label="Retirer le filtre organisation"
              />
            }
          >
            {filteredOrgName ?? 'Organisation filtrée'}
          </Badge>
        )}
      </Group>

      <Table.ScrollContainer minWidth={700}>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nom</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Organisation</Table.Th>
              <Table.Th>Rôle</Table.Th>
              <Table.Th>Email vérifié</Table.Th>
              <Table.Th>Créé le</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data?.data.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {user.firstName} {user.lastName}
                  </Text>
                </Table.Td>
                <Table.Td>{user.email}</Table.Td>
                <Table.Td>
                  <Button
                    component={Link}
                    to={`/admin/organizations/${user.organizationId}`}
                    variant="subtle"
                    size="compact-sm"
                  >
                    {user.organizationName}
                  </Button>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light">{user.role}</Badge>
                </Table.Td>
                <Table.Td>{user.emailVerifiedAt ? 'Oui' : 'Non'}</Table.Td>
                <Table.Td>{formatDate(user.createdAt)}</Table.Td>
              </Table.Tr>
            ))}
            {!isLoading && data?.data.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    Aucun utilisateur ne correspond à ces critères.
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
