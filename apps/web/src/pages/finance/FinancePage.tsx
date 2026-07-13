import type { ExpenseDto, FraudAnomalyDto, MonthlyFinanceTrendDto, ProductProfitabilityDto } from '@copilote/shared';
import { Badge, Button, Card, Group, SimpleGrid, Stack, Text, Tabs } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
  IconChartBar,
  IconChartLine,
  IconPlus,
  IconReceipt2,
  IconShieldExclamation,
  IconTrendingDown,
  IconTrendingUp,
} from '@tabler/icons-react';
import { useState } from 'react';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { useExpenses } from '../../hooks/useExpenses';
import { useFinanceSummary, useMonthlyTrend, useProductsProfitability } from '../../hooks/useFinance';
import { useFraudAnomalies } from '../../hooks/useFraud';
import { formatCurrency, formatDate, formatPercent } from '../../lib/format';
import { EXPENSE_CATEGORY_LABELS } from '../../lib/labels';
import { ExpenseFormModal } from './ExpenseFormModal';

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Card withBorder padding="lg" radius="md">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="xl" fw={700} c={color}>
        {value}
      </Text>
    </Card>
  );
}

export function FinancePage() {
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [expenseModalOpened, { open: openExpenseModal, close: closeExpenseModal }] =
    useDisclosure(false);

  const from = fromDate?.toISOString();
  const to = toDate?.toISOString();

  const { data: summary, isLoading: isLoadingSummary } = useFinanceSummary(from, to);
  const { data: profitability = [], isLoading: isLoadingProfitability } =
    useProductsProfitability(from, to);
  const { data: expenses = [], isLoading: isLoadingExpenses } = useExpenses(from, to);
  const { data: trend = [], isLoading: isLoadingTrend } = useMonthlyTrend();
  const { data: anomalies = [], isLoading: isLoadingAnomalies } = useFraudAnomalies();

  const profitabilityColumns: DataTableColumn<ProductProfitabilityDto>[] = [
    { key: 'productName', label: 'Produit', render: (p) => p.productName },
    { key: 'quantitySold', label: 'Quantité vendue', textAlign: 'right', render: (p) => p.quantitySold },
    {
      key: 'totalRevenue',
      label: 'Chiffre d\'affaires',
      textAlign: 'right',
      render: (p) => formatCurrency(p.totalRevenue),
    },
    {
      key: 'estimatedCost',
      label: 'Coût estimé',
      textAlign: 'right',
      render: (p) => formatCurrency(p.estimatedCost),
    },
    {
      key: 'estimatedMargin',
      label: 'Marge estimée',
      textAlign: 'right',
      render: (p) => (
        <Text c={p.estimatedMargin >= 0 ? 'green' : 'red'} fw={600}>
          {formatCurrency(p.estimatedMargin)}
        </Text>
      ),
    },
  ];

  const expenseColumns: DataTableColumn<ExpenseDto>[] = [
    { key: 'expenseDate', label: 'Date', render: (e) => formatDate(e.expenseDate) },
    {
      key: 'category',
      label: 'Catégorie',
      render: (e) => <Badge variant="light">{EXPENSE_CATEGORY_LABELS[e.category]}</Badge>,
    },
    {
      key: 'description',
      label: 'Description',
      render: (e) => (
        <Text size="sm" c="dimmed">
          {e.description ?? '—'}
        </Text>
      ),
    },
    {
      key: 'amount',
      label: 'Montant',
      textAlign: 'right',
      render: (e) => formatCurrency(e.amount),
    },
  ];

  const trendColumns: DataTableColumn<MonthlyFinanceTrendDto>[] = [
    { key: 'month', label: 'Mois', render: (t) => t.month },
    { key: 'totalRevenue', label: "Chiffre d'affaires", textAlign: 'right', render: (t) => formatCurrency(t.totalRevenue) },
    { key: 'totalExpenses', label: 'Dépenses', textAlign: 'right', render: (t) => formatCurrency(t.totalExpenses) },
    { key: 'grossMarginRatio', label: 'Marge brute', textAlign: 'right', render: (t) => formatPercent(t.grossMarginRatio) },
    {
      key: 'netProfit',
      label: 'Bénéfice net',
      textAlign: 'right',
      render: (t) => (
        <Text c={t.netProfit >= 0 ? 'green' : 'red'} fw={600}>
          {formatCurrency(t.netProfit)}
        </Text>
      ),
    },
    {
      key: 'revenueGrowthRatio',
      label: 'Croissance CA',
      textAlign: 'right',
      render: (t) =>
        t.revenueGrowthRatio === null ? (
          <Text size="sm" c="dimmed">—</Text>
        ) : (
          <Text c={t.revenueGrowthRatio >= 0 ? 'green' : 'red'} fw={600}>
            {formatPercent(t.revenueGrowthRatio)}
          </Text>
        ),
    },
  ];

  const anomalyColumns: DataTableColumn<FraudAnomalyDto>[] = [
    {
      key: 'severity',
      label: 'Sévérité',
      render: (a) => (
        <Badge color={a.severity === 'high' ? 'red' : 'orange'} variant="light">
          {a.severity === 'high' ? 'Élevée' : 'Moyenne'}
        </Badge>
      ),
    },
    { key: 'productName', label: 'Produit', render: (a) => a.productName },
    {
      key: 'description',
      label: 'Description',
      render: (a) => (
        <Text size="sm" c="dimmed">
          {a.description}
        </Text>
      ),
    },
    { key: 'occurrencesCount', label: 'Occurrences', textAlign: 'right', render: (a) => a.occurrencesCount },
  ];

  return (
    <>
      <PageHeader title="Finance" description="Marges, bénéfices et rentabilité" />

      <Group mb="lg">
        <DatePickerInput
          label="Du"
          placeholder="Toutes dates"
          value={fromDate}
          onChange={setFromDate}
          clearable
        />
        <DatePickerInput
          label="Au"
          placeholder="Toutes dates"
          value={toDate}
          onChange={setToDate}
          clearable
        />
      </Group>

      <Tabs defaultValue="summary">
        <Tabs.List>
          <Tabs.Tab value="summary" leftSection={<IconChartBar size={16} />}>
            Résumé
          </Tabs.Tab>
          <Tabs.Tab value="expenses" leftSection={<IconReceipt2 size={16} />}>
            Dépenses
          </Tabs.Tab>
          <Tabs.Tab value="trend" leftSection={<IconChartLine size={16} />}>
            Tendances
          </Tabs.Tab>
          <Tabs.Tab value="anomalies" leftSection={<IconShieldExclamation size={16} />}>
            Anomalies {anomalies.length > 0 && `(${anomalies.length})`}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="summary" pt="md">
          <Stack gap="xl">
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
              <StatCard
                label="Chiffre d'affaires"
                value={isLoadingSummary ? '—' : formatCurrency(summary?.totalRevenue ?? 0)}
              />
              <StatCard
                label="Coût des marchandises vendues"
                value={isLoadingSummary ? '—' : formatCurrency(summary?.totalCogs ?? 0)}
              />
              <StatCard
                label="Marge brute"
                value={isLoadingSummary ? '—' : formatCurrency(summary?.grossMargin ?? 0)}
              />
              <StatCard
                label="Dépenses"
                value={isLoadingSummary ? '—' : formatCurrency(summary?.totalExpenses ?? 0)}
              />
              <StatCard
                label="Bénéfice net"
                value={isLoadingSummary ? '—' : formatCurrency(summary?.netProfit ?? 0)}
                color={
                  isLoadingSummary || !summary
                    ? undefined
                    : summary.netProfit >= 0
                      ? 'green'
                      : 'red'
                }
              />
              <StatCard
                label="Nombre de ventes"
                value={isLoadingSummary ? '—' : String(summary?.salesCount ?? 0)}
              />
            </SimpleGrid>

            {summary && (
              <Group gap={6}>
                {summary.netProfit >= 0 ? (
                  <IconTrendingUp size={16} color="var(--mantine-color-green-6)" />
                ) : (
                  <IconTrendingDown size={16} color="var(--mantine-color-red-6)" />
                )}
                <Text size="sm" c="dimmed">
                  {summary.netProfit >= 0
                    ? 'Bénéfice positif sur la période sélectionnée.'
                    : 'Bénéfice négatif sur la période sélectionnée.'}
                </Text>
              </Group>
            )}

            <div>
              <Text fw={600} mb="sm">
                Rentabilité par produit
              </Text>
              <DataTable
                columns={profitabilityColumns}
                rows={profitability}
                rowKey={(p) => p.productId}
                isLoading={isLoadingProfitability}
                emptyMessage="Aucune vente sur la période sélectionnée."
              />
            </div>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="expenses" pt="md">
          <Button leftSection={<IconPlus size={16} />} onClick={openExpenseModal} mb="md">
            Nouvelle dépense
          </Button>
          <DataTable
            columns={expenseColumns}
            rows={expenses}
            rowKey={(e) => e.id}
            isLoading={isLoadingExpenses}
            emptyMessage="Aucune dépense enregistrée sur la période sélectionnée."
          />
        </Tabs.Panel>

        <Tabs.Panel value="trend" pt="md">
          <DataTable
            columns={trendColumns}
            rows={trend}
            rowKey={(t) => t.month}
            isLoading={isLoadingTrend}
            emptyMessage="Pas assez de données pour calculer une tendance."
          />
        </Tabs.Panel>

        <Tabs.Panel value="anomalies" pt="md">
          <Text size="sm" c="dimmed" mb="sm">
            Ce sont des signaux statistiques à vérifier, pas des preuves de fraude.
          </Text>
          <DataTable
            columns={anomalyColumns}
            rows={anomalies}
            rowKey={(a) => `${a.type}-${a.productId}-${a.performedByUserId ?? 'anon'}`}
            isLoading={isLoadingAnomalies}
            emptyMessage="Aucune anomalie détectée."
          />
        </Tabs.Panel>
      </Tabs>

      <ExpenseFormModal opened={expenseModalOpened} onClose={closeExpenseModal} />
    </>
  );
}
