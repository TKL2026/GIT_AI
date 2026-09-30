import type { PaymentTransactionDto, PlanDto } from '@copilote/shared';
import { Badge, Button, Card, Group, SimpleGrid, Skeleton, Stack, Text, Title } from '@mantine/core';
import { useState } from 'react';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { useOrganization } from '../../hooks/useOrganization';
import { usePlans, useSubscription, useTransactions } from '../../hooks/useBilling';
import { formatCurrency, formatDate } from '../../lib/format';
import {
  MOBILE_MONEY_OPERATOR_LABELS,
  PAYMENT_TRANSACTION_STATUS_COLORS,
  PAYMENT_TRANSACTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_COLORS,
  SUBSCRIPTION_STATUS_LABELS,
} from '../../lib/labels';
import { PaymentModal } from './PaymentModal';

const PERIOD_LABEL: Record<string, string> = { MONTHLY: 'mois', YEARLY: 'an' };

// Accès déjà restreint à OWNER/ADMIN par RoleGuard au niveau de la route
// (voir App.tsx) — cohérent avec le patron déjà utilisé pour Finance/Copilote.
export function BillingPage() {
  const { data: organization } = useOrganization();
  const { data: subscription, isLoading: isSubscriptionLoading } = useSubscription();
  const { data: plans = [], isLoading: isPlansLoading } = usePlans();
  const { data: transactions = [], isLoading: isTransactionsLoading } = useTransactions();
  const [selectedPlan, setSelectedPlan] = useState<PlanDto | null>(null);

  const columns: DataTableColumn<PaymentTransactionDto>[] = [
    { key: 'createdAt', label: 'Date', render: (t) => formatDate(t.createdAt) },
    { key: 'amount', label: 'Montant', render: (t) => formatCurrency(t.amount) },
    { key: 'operator', label: 'Moyen de paiement', render: (t) => MOBILE_MONEY_OPERATOR_LABELS[t.operator] },
    { key: 'reference', label: 'Référence', render: (t) => t.externalReference },
    {
      key: 'status',
      label: 'Statut',
      render: (t) => (
        <Badge color={PAYMENT_TRANSACTION_STATUS_COLORS[t.status]} variant="light">
          {PAYMENT_TRANSACTION_STATUS_LABELS[t.status]}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Abonnement" description={`Organisation : ${organization?.name ?? ''}`} />

      <Stack gap="xl">
        <Card>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Abonnement actuel
            </Text>
            {isSubscriptionLoading ? (
              <Skeleton height={28} width={200} />
            ) : subscription ? (
              <Group justify="space-between" wrap="wrap">
                <Group gap="sm">
                  <Text fw={700} size="lg">
                    {subscription.plan?.name ?? '—'}
                  </Text>
                  <Badge color={SUBSCRIPTION_STATUS_COLORS[subscription.status]} variant="light">
                    {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
                  </Badge>
                </Group>
                {subscription.currentPeriodEnd && (
                  <Text size="sm" c="dimmed">
                    Expire le {formatDate(subscription.currentPeriodEnd)}
                  </Text>
                )}
              </Group>
            ) : (
              <Text c="dimmed">Aucun abonnement actif pour le moment — accès libre.</Text>
            )}
          </Stack>
        </Card>

        <Stack gap="sm">
          <Title order={4}>Plans disponibles</Title>
          {isPlansLoading ? (
            <Skeleton height={160} />
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              {plans.map((plan) => (
                <Card key={plan.id} withBorder padding="lg">
                  <Stack gap="xs">
                    <Text fw={700}>{plan.name}</Text>
                    <Text fw={700} size="xl">
                      {formatCurrency(plan.price)}
                      <Text component="span" size="sm" c="dimmed">
                        {' '}
                        / {PERIOD_LABEL[plan.period] ?? plan.period.toLowerCase()}
                      </Text>
                    </Text>
                    <Button
                      mt="sm"
                      variant={subscription?.plan?.id === plan.id ? 'default' : 'filled'}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      {subscription?.plan?.id === plan.id ? 'Renouveler' : 'Choisir ce plan'}
                    </Button>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Stack>

        <Stack gap="sm">
          <Title order={4}>Historique des paiements</Title>
          <DataTable
            columns={columns}
            rows={transactions}
            rowKey={(t) => t.id}
            isLoading={isTransactionsLoading}
            emptyMessage="Aucun paiement pour le moment."
            pageSize={10}
          />
        </Stack>
      </Stack>

      <PaymentModal opened={!!selectedPlan} plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
    </>
  );
}
