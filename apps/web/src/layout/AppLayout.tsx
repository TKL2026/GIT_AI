import { AppShell, Burger, Group, Menu, NavLink, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBoxSeam,
  IconChevronDown,
  IconLayoutDashboard,
  IconLogout,
  IconPackage,
  IconReceipt,
  IconTruckDelivery,
} from '@tabler/icons-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Tableau de bord', icon: IconLayoutDashboard },
  { to: '/products', label: 'Produits', icon: IconPackage },
  { to: '/stock', label: 'Stock', icon: IconBoxSeam },
  { to: '/sales', label: 'Ventes', icon: IconReceipt },
  { to: '/purchases', label: 'Achats', icon: IconTruckDelivery },
];

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure();
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4}>Copilote IA Business</Title>
          </Group>

          <Menu shadow="md" width={220} position="bottom-end">
            <Menu.Target>
              <UnstyledButton>
                <Group gap={6}>
                  <Stack gap={0} align="flex-end" visibleFrom="xs">
                    <Text size="sm" fw={500}>
                      {user?.firstName} {user?.lastName}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {user?.role}
                    </Text>
                  </Stack>
                  <IconChevronDown size={16} />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconLogout size={16} />} onClick={logout} color="red">
                Se déconnecter
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            component={Link}
            to={item.to}
            label={item.label}
            leftSection={<item.icon size={18} />}
            active={location.pathname === item.to}
            style={{ borderRadius: 8 }}
            mb={4}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
