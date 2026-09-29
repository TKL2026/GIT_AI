import type { UserDto } from '@copilote/shared';
import { Badge } from '@mantine/core';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { useUsers } from '../hooks/useUsers';
import { formatDate } from '../lib/format';

export function UsersPage() {
  const { data: users = [], isLoading } = useUsers();

  const columns: DataTableColumn<UserDto>[] = [
    { key: 'name', label: 'Nom', render: (u) => `${u.firstName} ${u.lastName}` },
    { key: 'email', label: 'Email', render: (u) => u.email },
    { key: 'role', label: 'Rôle', render: (u) => <Badge variant="light">{u.role}</Badge> },
    { key: 'createdAt', label: 'Ajouté le', render: (u) => formatDate(u.createdAt) },
  ];

  return (
    <>
      <PageHeader title="Utilisateurs" description="Membres de votre organisation." />
      <DataTable
        columns={columns}
        rows={users}
        rowKey={(u) => u.id}
        isLoading={isLoading}
        emptyMessage="Aucun utilisateur."
      />
    </>
  );
}
