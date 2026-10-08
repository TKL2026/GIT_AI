import { AppShell, Badge, Burger, Group, NavLink, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconArrowLeft,
  IconBuildingSkyscraper,
  IconCreditCard,
  IconHistory,
  IconLayoutDashboard,
  IconLogout,
  IconReportMoney,
  IconServer2,
  IconUsers,
} from '@tabler/icons-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { useAdminAuth } from './AdminAuthContext';

const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Tableau de bord', icon: IconLayoutDashboard, exact: true },
  { to: '/admin/organizations', label: 'Organisations', icon: IconBuildingSkyscraper },
  { to: '/admin/users', label: 'Utilisateurs', icon: IconUsers },
  { to: '/admin/subscriptions', label: 'Abonnements', icon: IconCreditCard },
  { to: '/admin/payments', label: 'Paiements', icon: IconReportMoney },
  { to: '/admin/system', label: 'Système', icon: IconServer2 },
  { to: '/admin/audit-logs', label: "Journal d'audit", icon: IconHistory },
];

function isActive(pathname: string, to: string, exact?: boolean): boolean {
  if (exact) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AdminLayout() {
  const [opened, { toggle }] = useDisclosure();
  const { admin, logout } = useAdminAuth();
  const location = useLocation();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Logo size="sm" />
            <Badge color="amber" variant="light">
              Admin
            </Badge>
          </Group>

          <Group gap="md">
            <Stack gap={0} align="flex-end" visibleFrom="xs">
              <Text size="sm" fw={500}>
                {admin?.firstName} {admin?.lastName}
              </Text>
              <Text size="xs" c="dimmed">
                {admin?.email}
              </Text>
            </Stack>
            <UnstyledButton component={Link} to="/dashboard" title="Retour à l'espace UGE">
              <Group gap={4}>
                <IconArrowLeft size={16} />
                <Text size="sm" visibleFrom="sm">
                  Espace UGE
                </Text>
              </Group>
            </UnstyledButton>
            <UnstyledButton onClick={logout} c="red" title="Se déconnecter">
              <IconLogout size={18} />
            </UnstyledButton>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {ADMIN_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            component={Link}
            to={item.to}
            label={item.label}
            leftSection={<item.icon size={18} />}
            active={isActive(location.pathname, item.to, item.exact)}
            style={{ borderRadius: 8 }}
            mb={4}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
