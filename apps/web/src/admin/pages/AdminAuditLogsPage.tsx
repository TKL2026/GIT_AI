import { Group, Pagination, Stack, Table, Text } from '@mantine/core';
import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { formatDate } from '../../lib/format';
import { useAdminAuditLogs } from '../hooks/useAdminAuditLogs';

const PAGE_SIZE = 30;

const ACTION_LABELS: Record<string, string> = {
  'admin.login': 'Connexion admin',
  'organization.view': "Consultation d'organisation",
  'organization.suspend': 'Suspension organisation',
  'organization.reactivate': 'Réactivation organisation',
  'organization.extend_trial': "Prolongation d'essai",
};

export function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminAuditLogs({ page, pageSize: PAGE_SIZE });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <Stack gap="lg">
      <PageHeader title="Journal d'audit" description="Trace append-only des actions administratives" />

      <Table.ScrollContainer minWidth={700}>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Administrateur</Table.Th>
              <Table.Th>Action</Table.Th>
              <Table.Th>Cible</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data?.data.map((log) => (
              <Table.Tr key={log.id}>
                <Table.Td>{formatDate(log.createdAt)}</Table.Td>
                <Table.Td>
                  {log.platformAdmin.firstName} {log.platformAdmin.lastName}
                </Table.Td>
                <Table.Td>{ACTION_LABELS[log.action] ?? log.action}</Table.Td>
                <Table.Td>
                  {log.targetType && log.targetId ? (
                    <Text size="xs" c="dimmed" ff="monospace">
                      {log.targetType}:{log.targetId}
                    </Text>
                  ) : (
                    '—'
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
            {!isLoading && data?.data.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    Aucune action journalisée pour le moment.
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
