import { Role, type UserDto } from '@copilote/shared';
import { Badge, Button, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUserPlus } from '@tabler/icons-react';
import { useAuth } from '../auth/AuthContext';
import { hasRole } from '../auth/roles';
import { InviteTeamPanel } from '../components/InviteTeamPanel';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { useUsers } from '../hooks/useUsers';
import { formatDate } from '../lib/format';

/**
 * Seul le OWNER peut inviter (voir OrganizationInvitesController, @Roles
 * (Role.OWNER)) — BUG-010 : avant cette correction, aucune action
 * d'invitation n'existait en dehors de l'onboarding initial.
 */
export function UsersPage() {
  const { user } = useAuth();
  const { data: users = [], isLoading } = useUsers();
  const [inviteModalOpened, { open: openInviteModal, close: closeInviteModal }] = useDisclosure(false);

  const canInvite = hasRole(user, [Role.OWNER]);

  const columns: DataTableColumn<UserDto>[] = [
    { key: 'name', label: 'Nom', render: (u) => `${u.firstName} ${u.lastName}` },
    { key: 'email', label: 'Email', render: (u) => u.email },
    { key: 'role', label: 'Rôle', render: (u) => <Badge variant="light">{u.role}</Badge> },
    { key: 'createdAt', label: 'Ajouté le', render: (u) => formatDate(u.createdAt) },
  ];

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        description="Membres de votre organisation."
        action={
          canInvite && (
            <Button leftSection={<IconUserPlus size={16} />} onClick={openInviteModal}>
              Inviter un utilisateur
            </Button>
          )
        }
      />
      <DataTable
        columns={columns}
        rows={users}
        rowKey={(u) => u.id}
        isLoading={isLoading}
        emptyMessage="Aucun utilisateur."
      />

      {canInvite && (
        <Modal opened={inviteModalOpened} onClose={closeInviteModal} title="Inviter un utilisateur" size="lg">
          <InviteTeamPanel />
        </Modal>
      )}
    </>
  );
}
