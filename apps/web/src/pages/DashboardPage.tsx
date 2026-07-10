import { Card, SimpleGrid, Text, Title } from '@mantine/core';
import { IconBoxSeam, IconPackage, IconReceipt } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/PageHeader';

const SHORTCUTS = [
  {
    to: '/products',
    label: 'Produits',
    description: 'Catalogue, prix et seuils de stock',
    icon: IconPackage,
  },
  {
    to: '/stock',
    label: 'Stock',
    description: 'Mouvements et alertes de rupture',
    icon: IconBoxSeam,
  },
  {
    to: '/sales',
    label: 'Ventes',
    description: 'Enregistrement des ventes et historique',
    icon: IconReceipt,
  },
];

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description={`Bienvenue ${user?.firstName} ${user?.lastName} — ${user?.role}`}
      />

      <Title order={4} mb="sm">
        Accès rapide
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        {SHORTCUTS.map((shortcut) => (
          <Card
            key={shortcut.to}
            component={Link}
            to={shortcut.to}
            withBorder
            padding="lg"
            radius="md"
          >
            <shortcut.icon size={28} />
            <Text fw={600} mt="sm">
              {shortcut.label}
            </Text>
            <Text size="sm" c="dimmed">
              {shortcut.description}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </>
  );
}
