import { Badge, Card, Group, SimpleGrid, Skeleton, Stack, Table, Text, Title } from '@mantine/core';
import {
  IconBuildingSkyscraper,
  IconClock,
  IconCreditCard,
  IconReportMoney,
  IconUserCheck,
  IconUsers,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { KpiCard } from '../../components/KpiCard';
import { PageHeader } from '../../components/PageHeader';
import { formatCurrency } from '../../lib/format';
import { useAdminDashboard } from '../hooks/useAdminDashboard';

export function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboard();

  if (isLoading || !data) {
    return (
      <Stack gap="lg">
        <PageHeader title="Tableau de bord" description="Vue globale de la plateforme UGE" />
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={110} />
          ))}
        </SimpleGrid>
      </Stack>
    );
  }

  const signupsSparkline = data.signupsLast30Days.map((row) => row.count);
  const activeCount = data.subscriptionStatusCounts.ACTIVE ?? 0;
  const trialCount = data.subscriptionStatusCounts.TRIAL ?? 0;
  const trialExpiredCount = data.subscriptionStatusCounts.TRIAL_EXPIRED ?? 0;
  const awaitingPaymentCount = data.subscriptionStatusCounts.AWAITING_PAYMENT ?? 0;

  return (
    <Stack gap="lg">
      <PageHeader title="Tableau de bord" description="Vue globale de la plateforme UGE" />

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <KpiCard
          icon={IconBuildingSkyscraper}
          label="Organisations"
          value={String(data.totalOrganizations)}
          sparkline={signupsSparkline}
          tooltip="Inscriptions des 30 derniers jours en mini-graphique."
          to="/admin/organizations"
        />
        <KpiCard icon={IconUsers} label="Utilisateurs" value={String(data.totalUsers)} to="/admin/users" />
        <KpiCard
          icon={IconUserCheck}
          label="Abonnements actifs"
          value={String(activeCount)}
          to="/admin/subscriptions?status=ACTIVE"
        />
        <KpiCard
          icon={IconReportMoney}
          label="Revenus encaissés (total)"
          value={formatCurrency(data.totalRevenueCollected)}
          tooltip="Somme des paiements CamPay confirmés (statut SUCCESS) à ce jour — pas un revenu récurrent mensuel estimé."
          to="/admin/payments?status=SUCCESS"
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <KpiCard
          icon={IconClock}
          label="En essai"
          value={String(trialCount)}
          to="/admin/subscriptions?status=TRIAL"
        />
        <KpiCard
          icon={IconClock}
          label="Essais expirés"
          value={String(trialExpiredCount)}
          to="/admin/subscriptions?status=TRIAL_EXPIRED"
        />
        <KpiCard
          icon={IconCreditCard}
          label="En attente de paiement"
          value={String(awaitingPaymentCount)}
          to="/admin/subscriptions?status=AWAITING_PAYMENT"
        />
        <KpiCard
          icon={IconBuildingSkyscraper}
          label="Sans abonnement"
          value={String(data.organizationsWithoutSubscription)}
          tooltip="Organisations sans ligne d'abonnement (comptes historiques/démo) — accès libre."
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Card>
          <Title order={4} mb="md">
            Dernières organisations inscrites
          </Title>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Entreprise</Table.Th>
                <Table.Th>Plan</Table.Th>
                <Table.Th>Statut</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.recentOrganizations.map((org) => (
                <Table.Tr key={org.id}>
                  <Table.Td>
                    <Text component={Link} to={`/admin/organizations/${org.id}`} size="sm" fw={500}>
                      {org.name}
                    </Text>
                  </Table.Td>
                  <Table.Td>{org.planCode ?? '—'}</Table.Td>
                  <Table.Td>
                    <Badge variant="light">{org.subscriptionStatus ?? '—'}</Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
              {data.recentOrganizations.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={3}>
                    <Text size="sm" c="dimmed">
                      Aucune organisation pour le moment.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>

        <Card>
          <Title order={4} mb="md">
            Répartition des plans
          </Title>
          <Stack gap="sm">
            {data.planDistribution.map((plan) => (
              <Group key={plan.planCode} justify="space-between">
                <Text size="sm">{plan.planName}</Text>
                <Badge variant="light" color="emerald">
                  {plan.count}
                </Badge>
              </Group>
            ))}
            {data.planDistribution.length === 0 && (
              <Text size="sm" c="dimmed">
                Aucun abonnement associé à un plan pour le moment.
              </Text>
            )}
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
