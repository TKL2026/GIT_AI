import { Card, Center, Loader, SimpleGrid, Text, Title } from '@mantine/core';
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
import { StatCard } from '../components/StatCard';
import { useMonthlyTrend } from '../hooks/useFinance';
import { useReplenishmentForecast } from '../hooks/useForecast';
import { useFraudAnomalies } from '../hooks/useFraud';
import { usePurchaseOrders } from '../hooks/usePurchases';
import { useStockAlerts } from '../hooks/useStock';
import { formatCurrency } from '../lib/format';

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
  const canSeeFinance = hasRole(user, FINANCE_ROLES);
  const visibleShortcuts = SHORTCUTS.filter((s) => !s.roles || hasRole(user, s.roles));

  const { data: trend, isLoading: isTrendLoading } = useMonthlyTrend(1, canSeeFinance);
  const { data: alerts = [], isLoading: isAlertsLoading } = useStockAlerts();
  const { data: forecast = [], isLoading: isForecastLoading } = useReplenishmentForecast();
  const { data: anomalies = [], isLoading: isAnomaliesLoading } = useFraudAnomalies(canSeeFinance);
  const { data: purchaseOrders = [], isLoading: isPurchaseOrdersLoading } = usePurchaseOrders();

  const isLoading =
    isAlertsLoading ||
    isForecastLoading ||
    isPurchaseOrdersLoading ||
    (canSeeFinance && (isTrendLoading || isAnomaliesLoading));

  const currentMonth = trend?.[0];
  const productsToReorder = forecast.filter((f) => (f.recommendedReorderQuantity ?? 0) > 0).length;
  const pendingOrders = purchaseOrders.filter((o) => o.status === 'PENDING').length;

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description={`Bienvenue ${user?.firstName} ${user?.lastName} — ${user?.role}`}
      />

      <Title order={4} mb="sm">
        Vue d'ensemble
      </Title>
      {isLoading ? (
        <Center py="xl" mb="xl">
          <Loader size="sm" />
        </Center>
      ) : (
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} mb="xl">
        {canSeeFinance && (
          <StatCard
            to="/finance"
            label="Chiffre d'affaires (mois en cours)"
            value={currentMonth ? formatCurrency(currentMonth.totalRevenue) : '—'}
          />
        )}
        {canSeeFinance && (
          <StatCard
            to="/finance"
            label="Bénéfice net (mois en cours)"
            value={currentMonth ? formatCurrency(currentMonth.netProfit) : '—'}
            color={currentMonth ? (currentMonth.netProfit >= 0 ? 'green' : 'red') : undefined}
          />
        )}
        <StatCard
          to="/stock"
          label="Produits en alerte de stock"
          value={String(alerts.length)}
          color={alerts.length > 0 ? 'red' : undefined}
        />
        <StatCard
          to="/stock"
          label="Produits à réapprovisionner bientôt"
          value={String(productsToReorder)}
          color={productsToReorder > 0 ? 'orange' : undefined}
        />
        {canSeeFinance && (
          <StatCard
            to="/finance"
            label="Anomalies détectées"
            value={String(anomalies.length)}
            color={anomalies.length > 0 ? 'red' : undefined}
          />
        )}
        <StatCard
          to="/purchases"
          label="Commandes fournisseurs en attente"
          value={String(pendingOrders)}
        />
      </SimpleGrid>
      )}

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
