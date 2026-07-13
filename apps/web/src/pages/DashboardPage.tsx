import { Card, SimpleGrid, Text, Title } from '@mantine/core';
import {
  IconBoxSeam,
  IconBriefcase,
  IconMessageChatbot,
  IconPackage,
  IconReceipt,
  IconReportMoney,
  IconTruckDelivery,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { FINANCE_ROLES, hasRole } from '../auth/roles';
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
  {
    to: '/commercial',
    label: 'Commercial',
    description: 'Produits à pousser, clients et ventes croisées',
    icon: IconBriefcase,
  },
  {
    to: '/purchases',
    label: 'Achats',
    description: "Fournisseurs et commandes d'approvisionnement",
    icon: IconTruckDelivery,
  },
  {
    to: '/finance',
    label: 'Finance',
    description: 'Marges, bénéfices et rentabilité',
    icon: IconReportMoney,
    roles: FINANCE_ROLES,
  },
  {
    to: '/copilot',
    label: 'Copilote IA',
    description: 'Questions en langage naturel sur votre activité',
    icon: IconMessageChatbot,
    roles: FINANCE_ROLES,
  },
];

export function DashboardPage() {
  const { user } = useAuth();
  const visibleShortcuts = SHORTCUTS.filter((s) => !s.roles || hasRole(user, s.roles));

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
        {visibleShortcuts.map((shortcut) => (
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
