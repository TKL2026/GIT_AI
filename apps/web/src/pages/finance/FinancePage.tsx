import type { ExpenseDto, FraudAnomalyDto, MonthlyFinanceTrendDto, ProductProfitabilityDto } from '@copilote/shared';
import { FEATURES } from '@copilote/shared';
import { Badge, Button, Card, Center, Group, SimpleGrid, Stack, Text, Tabs, Title } from '@mantine/core';
import { BarChart, DonutChart, LineChart } from '@mantine/charts';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
  IconChartBar,
  IconChartLine,
  IconCash,
  IconLock,
  IconPlus,
  IconReceipt,
  IconReceipt2,
  IconShieldExclamation,
  IconSparkles,
  IconTrendingDown,
  IconTrendingUp,
  IconWallet,
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { KpiCard } from '../../components/KpiCard';
import { PageHeader } from '../../components/PageHeader';
import { useCopilotChat } from '../../hooks/useCopilot';
import { useExpenses } from '../../hooks/useExpenses';
import { useFinanceSummary, useMonthlyTrend, useProductsProfitability } from '../../hooks/useFinance';
import { useFraudAnomalies } from '../../hooks/useFraud';
import { useOrganization } from '../../hooks/useOrganization';
import { hasFeature } from '../../lib/entitlements';
import { formatCurrency, formatDate, formatPercent } from '../../lib/format';
import { EXPENSE_CATEGORY_LABELS } from '../../lib/labels';
import { ExpenseFormModal } from './ExpenseFormModal';

function ProFeatureNotice({ label }: { label: string }) {
  return (
    <Center py="xl">
      <Stack align="center" gap="xs">
        <IconLock size={28} color="var(--mantine-color-dimmed)" />
        <Text c="dimmed" size="sm" ta="center">
          {label} fait partie de l'offre Pro.
        </Text>
      </Stack>
    </Center>
  );
}

const DONUT_COLORS = ['emerald.6', 'amber.6', 'error.6', 'blue.6', 'grape.6', 'gray.6'];

export function FinancePage() {
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [expenseModalOpened, { open: openExpenseModal, close: closeExpenseModal }] =
    useDisclosure(false);

  const from = fromDate?.toISOString();
  const to = toDate?.toISOString();

  const { data: organization } = useOrganization();
  const hasFinanceAdvanced = hasFeature(organization, FEATURES.FINANCE_ADVANCED);
  const hasFraud = hasFeature(organization, FEATURES.FRAUD);

  const { data: summary, isLoading: isLoadingSummary } = useFinanceSummary(from, to);
  const { data: profitability = [], isLoading: isLoadingProfitability } =
    useProductsProfitability(from, to, hasFinanceAdvanced);
  const { data: expenses = [], isLoading: isLoadingExpenses } = useExpenses(from, to);
  const { data: trend = [], isLoading: isLoadingTrend } = useMonthlyTrend(undefined, hasFinanceAdvanced);
  const { data: anomalies = [], isLoading: isLoadingAnomalies } = useFraudAnomalies(hasFraud);
  const chat = useCopilotChat();

  const trendData = useMemo(
    () =>
      trend
        .slice()
        .reverse()
        .map((t) => ({ month: t.month, CA: t.totalRevenue, Dépenses: t.totalExpenses })),
    [trend],
  );

  const expensesByCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of expenses) {
      totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
    }
    return Array.from(totals.entries()).map(([category, value], index) => ({
      name: EXPENSE_CATEGORY_LABELS[category as keyof typeof EXPENSE_CATEGORY_LABELS],
      value,
      color: DONUT_COLORS[index % DONUT_COLORS.length],
    }));
  }, [expenses]);

  const topMarginProducts = useMemo(
    () =>
      profitability
        .slice()
        .sort((a, b) => b.estimatedMargin - a.estimatedMargin)
        .slice(0, 6)
        .map((p) => ({ product: p.productName, Marge: p.estimatedMargin })),
    [profitability],
  );

  const profitabilityColumns: DataTableColumn<ProductProfitabilityDto>[] = [
    { key: 'productName', label: 'Produit', render: (p) => p.productName },
    { key: 'quantitySold', label: 'Quantité vendue', textAlign: 'right', render: (p) => p.quantitySold },
    {
      key: 'totalRevenue',
      label: "Chiffre d'affaires",
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
        <Text c={p.estimatedMargin >= 0 ? 'emerald.7' : 'error.7'} fw={600}>
          {formatCurrency(p.estimatedMargin)}
        </Text>
      ),
      sortValue: (p) => p.estimatedMargin,
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
      sortValue: (e) => e.amount,
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
        <Text c={t.netProfit >= 0 ? 'emerald.7' : 'error.7'} fw={600}>
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
          <Text c={t.revenueGrowthRatio >= 0 ? 'emerald.7' : 'error.7'} fw={600}>
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
        <Badge color={a.severity === 'high' ? 'error' : 'warning'} variant="light">
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
              <KpiCard
                icon={IconCash}
                label="Chiffre d'affaires"
                value={isLoadingSummary ? '—' : formatCurrency(summary?.totalRevenue ?? 0)}
              />
              <KpiCard
                icon={IconReceipt}
                label="Coût des marchandises vendues"
                value={isLoadingSummary ? '—' : formatCurrency(summary?.totalCogs ?? 0)}
              />
              <KpiCard
                icon={IconChartBar}
                label="Marge brute"
                value={isLoadingSummary ? '—' : formatCurrency(summary?.grossMargin ?? 0)}
              />
              <KpiCard
                icon={IconReceipt2}
                label="Dépenses"
                value={isLoadingSummary ? '—' : formatCurrency(summary?.totalExpenses ?? 0)}
              />
              <KpiCard
                icon={IconWallet}
                label="Bénéfice net"
                value={isLoadingSummary ? '—' : formatCurrency(summary?.netProfit ?? 0)}
              />
              <KpiCard
                icon={IconReceipt}
                label="Nombre de ventes"
                value={isLoadingSummary ? '—' : String(summary?.salesCount ?? 0)}
              />
            </SimpleGrid>

            {summary && (
              <Group gap={6}>
                {summary.netProfit >= 0 ? (
                  <IconTrendingUp size={16} color="var(--mantine-color-emerald-6)" />
                ) : (
                  <IconTrendingDown size={16} color="var(--mantine-color-error-6)" />
                )}
                <Text size="sm" c="dimmed">
                  {summary.netProfit >= 0
                    ? 'Bénéfice positif sur la période sélectionnée.'
                    : 'Bénéfice négatif sur la période sélectionnée.'}
                </Text>
              </Group>
            )}

            {topMarginProducts.length > 0 && (
              <Card>
                <Title order={5} mb="md">
                  Marge par produit (top 6)
                </Title>
                <BarChart
                  h={220}
                  data={topMarginProducts}
                  dataKey="product"
                  series={[{ name: 'Marge', color: 'emerald.6' }]}
                  withLegend={false}
                />
              </Card>
            )}

            <div>
              <Text fw={600} mb="sm">
                Rentabilité par produit
              </Text>
              {hasFinanceAdvanced ? (
                <DataTable
                  columns={profitabilityColumns}
                  rows={profitability}
                  rowKey={(p) => p.productId}
                  isLoading={isLoadingProfitability}
                  emptyMessage="Aucune vente sur la période sélectionnée."
                  pageSize={10}
                />
              ) : (
                <ProFeatureNotice label="L'analyse de rentabilité par produit" />
              )}
            </div>

            <Card>
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <IconSparkles size={18} color="var(--mantine-color-emerald-6)" />
                  <Title order={5}>Analyse Copilot</Title>
                </Group>
                <Button
                  variant="light"
                  size="xs"
                  loading={chat.isPending}
                  disabled={!summary}
                  onClick={() =>
                    summary &&
                    chat.mutate([
                      {
                        role: 'user',
                        content: `Analyse ces chiffres financiers (période ${fromDate ? formatDate(fromDate.toISOString()) : 'depuis le début'} au ${toDate ? formatDate(toDate.toISOString()) : "aujourd'hui"}) : chiffre d'affaires ${summary.totalRevenue} FCFA, coût des marchandises vendues ${summary.totalCogs} FCFA, marge brute ${summary.grossMargin} FCFA, dépenses ${summary.totalExpenses} FCFA, bénéfice net ${summary.netProfit} FCFA, ${summary.salesCount} ventes. Produits les plus rentables : ${topMarginProducts.map((p) => `${p.product} (${p.Marge} FCFA)`).join(', ') || 'aucun'}. Donne 2-3 observations courtes et concrètes, uniquement basées sur ces chiffres.`,
                      },
                    ])
                  }
                >
                  {chat.data ? 'Actualiser' : 'Analyser'}
                </Button>
              </Group>
              {chat.data ? (
                <ReactMarkdown>{chat.data.message}</ReactMarkdown>
              ) : (
                <Text size="sm" c="dimmed">
                  Demandez au copilote une lecture rapide de ces chiffres.
                </Text>
              )}
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="expenses" pt="md">
          <Button leftSection={<IconPlus size={16} />} onClick={openExpenseModal} mb="md">
            Nouvelle dépense
          </Button>
          {expensesByCategory.length > 1 && (
            <Card mb="md">
              <Title order={5} mb="md">
                Dépenses par catégorie
              </Title>
              <Group justify="center">
                <DonutChart data={expensesByCategory} withLabelsLine withLabels />
              </Group>
            </Card>
          )}
          {expensesByCategory.length === 1 && (
            <Card mb="md">
              <Title order={5} mb="md">
                Dépenses par catégorie
              </Title>
              <Group gap="xs">
                <Badge color={expensesByCategory[0].color} variant="filled" size="lg">
                  {expensesByCategory[0].name}
                </Badge>
                <Text size="sm" c="dimmed">
                  {formatCurrency(expensesByCategory[0].value)} — seule catégorie utilisée sur la période.
                </Text>
              </Group>
            </Card>
          )}
          <DataTable
            columns={expenseColumns}
            rows={expenses}
            rowKey={(e) => e.id}
            isLoading={isLoadingExpenses}
            emptyMessage="Aucune dépense enregistrée sur la période sélectionnée."
            pageSize={10}
          />
        </Tabs.Panel>

        <Tabs.Panel value="trend" pt="md">
          {!hasFinanceAdvanced ? (
            <ProFeatureNotice label="L'analyse des tendances mensuelles" />
          ) : (
            <>
          {trendData.length > 0 && (
            <SimpleGrid cols={{ base: 1, lg: 2 }} mb="md">
              <Card>
                <Title order={5} mb="md">
                  Évolution du chiffre d'affaires
                </Title>
                <LineChart
                  h={220}
                  data={trendData}
                  dataKey="month"
                  series={[{ name: 'CA', color: 'emerald.6' }]}
                  curveType="linear"
                  withLegend={false}
                />
              </Card>
              <Card>
                <Title order={5} mb="md">
                  Revenus vs dépenses
                </Title>
                <BarChart
                  h={220}
                  data={trendData}
                  dataKey="month"
                  series={[
                    { name: 'CA', color: 'emerald.6' },
                    { name: 'Dépenses', color: 'error.6' },
                  ]}
                />
              </Card>
            </SimpleGrid>
          )}
          <DataTable
            columns={trendColumns}
            rows={trend}
            rowKey={(t) => t.month}
            isLoading={isLoadingTrend}
            emptyMessage="Pas assez de données pour calculer une tendance."
          />
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="anomalies" pt="md">
          {!hasFraud ? (
            <ProFeatureNotice label="La détection d'anomalies" />
          ) : (
            <>
              <Text size="sm" c="dimmed" mb="sm">
                Ce sont des signaux statistiques à vérifier, pas des preuves de fraude.
              </Text>
              <DataTable
                columns={anomalyColumns}
                rows={anomalies}
                rowKey={(a) => `${a.type}-${a.productId}-${a.performedByUserId ?? 'anon'}`}
                isLoading={isLoadingAnomalies}
                emptyMessage="Aucune anomalie détectée."
                pageSize={10}
              />
            </>
          )}
        </Tabs.Panel>
      </Tabs>

      <ExpenseFormModal opened={expenseModalOpened} onClose={closeExpenseModal} />
    </>
  );
}
