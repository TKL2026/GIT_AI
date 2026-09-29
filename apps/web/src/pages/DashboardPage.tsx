import { PurchaseOrderStatus } from '@copilote/shared';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Timeline,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { LineChart } from '@mantine/charts';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAdjustments,
  IconAlertTriangle,
  IconArrowDownRight,
  IconArrowUpRight,
  IconBoxSeam,
  IconBulb,
  IconCash,
  IconCircleCheck,
  IconClipboardList,
  IconHistory,
  IconMessageChatbot,
  IconPackage,
  IconReceipt,
  IconShieldExclamation,
  IconSparkles,
  IconTruckDelivery,
  IconWallet,
  IconX,
  type Icon,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { FINANCE_ROLES, hasRole, SALES_MUTATION_ROLES, STOCK_MUTATION_ROLES } from '../auth/roles';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { KpiCard } from '../components/KpiCard';
import { PageHeader } from '../components/PageHeader';
import { RecommendationCard } from '../components/RecommendationCard';
import { useDailyReport } from '../hooks/useCopilot';
import { useCrossSellOpportunities, useProductsToPush } from '../hooks/useCommercial';
import { useFinanceSummary, useProductsProfitability } from '../hooks/useFinance';
import { useFraudAnomalies } from '../hooks/useFraud';
import { useReplenishmentForecast } from '../hooks/useForecast';
import { usePurchaseOrders } from '../hooks/usePurchases';
import { usePurchaseRecommendations } from '../hooks/usePurchasing';
import { useOrganization } from '../hooks/useOrganization';
import { useProducts } from '../hooks/useProducts';
import { useSales } from '../hooks/useSales';
import { useStockMovements } from '../hooks/useStock';
import { useSuppliers } from '../hooks/useSuppliers';
import { useUsers } from '../hooks/useUsers';
import { formatCurrency, formatDate } from '../lib/format';
import { type AlertSeverity, buildAlerts } from '../lib/dashboard/buildAlerts';
import { bucketSalesByDay } from '../lib/dashboard/bucketSalesByDay';
import { buildCopilotSummary } from '../lib/dashboard/buildCopilotSummary';
import { buildPerformanceSeries, type PerformanceMetric } from '../lib/dashboard/buildPerformanceSeries';
import { computeDecliningProducts } from '../lib/dashboard/computeDecliningProducts';
import { computeStockHealth, selectStockAttention, type StockHealthEntry } from '../lib/dashboard/computeStockHealth';
import { mergeActivity, type ActivityItem, type ActivityType } from '../lib/dashboard/mergeActivity';
import { changeRatio, getPeriodRange, PERIODS, type PeriodKey } from '../lib/dashboard/period';
import { ProductFormModal } from './products/ProductFormModal';
import { PurchaseOrderFormModal } from './purchases/PurchaseOrderFormModal';
import { SaleFormModal } from './sales/SaleFormModal';
import { StockMovementFormModal } from './stock/StockMovementFormModal';

function formatPerfValue(metric: PerformanceMetric, value: number): string {
  switch (metric) {
    case 'revenue':
    case 'margin':
      return formatCurrency(value);
    case 'salesCount':
      return String(value);
    case 'marginRatio':
      return `${value.toFixed(1)} %`;
  }
}

const PERF_METRIC_OPTIONS: { value: PerformanceMetric; label: string }[] = [
  { value: 'revenue', label: "Chiffre d'affaires" },
  { value: 'salesCount', label: 'Ventes' },
  { value: 'margin', label: 'Bénéfice' },
  { value: 'marginRatio', label: 'Marge' },
];

const ALERT_ICONS: Record<string, Icon> = {
  'stock-rupture': IconAlertTriangle,
  'stock-soon': IconAlertTriangle,
  'fraud-high': IconShieldExclamation,
  'fraud-medium': IconShieldExclamation,
  'purchase-stale': IconTruckDelivery,
  'purchase-recommendation': IconTruckDelivery,
  'commercial-push': IconBulb,
  'commercial-cross-sell': IconBulb,
};

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  critical: 'URGENT',
  warning: 'ATTENTION',
  opportunity: 'OPPORTUNITÉ',
  info: 'RECOMMANDATION',
};

const ACTIVITY_ICONS: Record<ActivityType, Icon> = {
  sale: IconReceipt,
  'stock-in': IconArrowUpRight,
  'stock-out': IconArrowDownRight,
  'stock-adjustment': IconAdjustments,
  'purchase-received': IconTruckDelivery,
  'purchase-created': IconClipboardList,
};

function formatActivityAmount(item: ActivityItem): string | null {
  if (item.amount === null) return null;
  if (item.type === 'stock-in' || item.type === 'stock-out' || item.type === 'stock-adjustment') {
    return `${item.amount > 0 ? '+' : ''}${item.amount} unités`;
  }
  return formatCurrency(item.amount);
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canSeeFinance = hasRole(user, FINANCE_ROLES);
  const canManageStock = hasRole(user, STOCK_MUTATION_ROLES);
  const canManageSales = hasRole(user, SALES_MUTATION_ROLES);
  const [period, setPeriod] = useState<PeriodKey>('7d');
  const [customRange, setCustomRange] = useState<[Date | null, Date | null]>([null, null]);
  const { from, to, prevFrom, prevTo } = useMemo(
    () => getPeriodRange({ key: period, customFrom: customRange[0], customTo: customRange[1] }),
    [period, customRange],
  );
  const periodLabel = period === 'custom' ? 'période personnalisée' : PERIODS[period].label;

  const [perfMetric, setPerfMetric] = useState<PerformanceMetric>('revenue');

  const { data: summary, isLoading: isSummaryLoading } = useFinanceSummary(from, to, canSeeFinance);
  const { data: prevSummary } = useFinanceSummary(prevFrom, prevTo, canSeeFinance);
  const { data: topProducts, isLoading: isTopProductsLoading } = useProductsProfitability(
    from,
    to,
    canSeeFinance,
  );
  const { data: prevTopProducts } = useProductsProfitability(prevFrom, prevTo, canSeeFinance);

  const { data: products = [], isLoading: isProductsLoading } = useProducts();
  const { data: purchaseOrders = [], isLoading: isPurchaseOrdersLoading } = usePurchaseOrders();
  const { data: sales = [], isLoading: isSalesLoading } = useSales();
  const { data: forecast = [] } = useReplenishmentForecast();
  const { data: fraudAnomalies = [] } = useFraudAnomalies(canSeeFinance);
  const { data: purchaseRecommendations = [] } = usePurchaseRecommendations();
  const { data: productsToPush = [] } = useProductsToPush();
  const { data: crossSell = [] } = useCrossSellOpportunities();
  const { data: stockMovements = [] } = useStockMovements();
  const { data: usersList = [] } = useUsers();
  const { data: organization } = useOrganization();
  const { data: suppliers = [] } = useSuppliers();

  const dailyReport = useDailyReport();

  const [welcomeBannerDismissed, setWelcomeBannerDismissed] = useState(false);
  useEffect(() => {
    if (organization) {
      setWelcomeBannerDismissed(localStorage.getItem(`onboarding-welcome-dismissed:${organization.id}`) === 'true');
    }
  }, [organization?.id]);
  const isRecentlyOnboarded =
    !!organization?.onboardingCompletedAt &&
    Date.now() - new Date(organization.onboardingCompletedAt).getTime() < 7 * 24 * 60 * 60 * 1000;
  const showWelcomeBanner = isRecentlyOnboarded && !welcomeBannerDismissed;
  function dismissWelcomeBanner() {
    if (organization) {
      localStorage.setItem(`onboarding-welcome-dismissed:${organization.id}`, 'true');
      setWelcomeBannerDismissed(true);
    }
  }

  const [orderModalOpened, { open: openOrderModal, close: closeOrderModal }] = useDisclosure(false);
  const [prefill, setPrefill] = useState<{
    item: { productId: string; quantity: number; unitCost?: number };
    supplierId?: string;
  } | null>(null);
  const recommendationByProduct = useMemo(
    () => new Map(purchaseRecommendations.map((r) => [r.productId, r])),
    [purchaseRecommendations],
  );
  function handlePrepareOrder(productId: string) {
    const recommendation = recommendationByProduct.get(productId);
    if (!recommendation) return;
    setPrefill({
      item: {
        productId,
        quantity: recommendation.recommendedQuantity,
        unitCost: recommendation.lastUnitCost ?? undefined,
      },
      supplierId: recommendation.recommendedSupplierId ?? undefined,
    });
    openOrderModal();
  }

  const productNameById = useMemo(() => new Map(products.map((p) => [p.id, p.name])), [products]);
  const userNameById = useMemo(
    () => new Map(usersList.map((u) => [u.id, `${u.firstName} ${u.lastName}`])),
    [usersList],
  );
  const activity = useMemo(
    () => mergeActivity(sales, purchaseOrders, stockMovements, productNameById),
    [sales, purchaseOrders, stockMovements, productNameById],
  );

  const isOrgEmpty = products.length === 0 && sales.length === 0 && purchaseOrders.length === 0;

  const [saleModalOpened, { open: openSaleModal, close: closeSaleModal }] = useDisclosure(false);
  const [productModalOpened, { open: openProductModal, close: closeProductModal }] = useDisclosure(false);
  const [movementModalOpened, { open: openMovementModal, close: closeMovementModal }] = useDisclosure(false);

  const quickActions: { label: string; description: string; icon: Icon; onClick: () => void }[] = [
    ...(canManageSales
      ? [{ label: 'Nouvelle vente', description: 'Enregistrer une vente', icon: IconReceipt, onClick: openSaleModal }]
      : []),
    ...(canManageStock
      ? [
          {
            label: 'Ajouter produit',
            description: 'Nouveau produit au catalogue',
            icon: IconPackage,
            onClick: openProductModal,
          },
        ]
      : []),
    ...(canManageStock
      ? [
          {
            label: 'Enregistrer réception',
            description: 'Entrée de stock',
            icon: IconArrowUpRight,
            onClick: openMovementModal,
          },
        ]
      : []),
    ...(canManageStock
      ? [
          {
            label: 'Nouvelle commande',
            description: "Commande d'approvisionnement",
            icon: IconClipboardList,
            onClick: () => {
              setPrefill(null);
              openOrderModal();
            },
          },
        ]
      : []),
    ...(canSeeFinance
      ? [
          {
            label: 'Demander au Copilote',
            description: 'Poser une question sur votre activité',
            icon: IconMessageChatbot,
            onClick: () => navigate('/copilot'),
          },
        ]
      : []),
  ];

  const stockHealth = useMemo(() => computeStockHealth(products, forecast), [products, forecast]);
  const stockAttention = useMemo(() => selectStockAttention(stockHealth.entries), [stockHealth]);
  const decliningProducts = useMemo(
    () => (canSeeFinance ? computeDecliningProducts(topProducts ?? [], prevTopProducts ?? []) : []),
    [canSeeFinance, topProducts, prevTopProducts],
  );

  const attentionColumns: DataTableColumn<StockHealthEntry>[] = [
    { key: 'name', label: 'Produit', render: (e) => e.product.name },
    { key: 'stock', label: 'Stock', textAlign: 'right', render: (e) => e.product.stockQuantity },
    {
      key: 'salesPerDay',
      label: 'Ventes/jour',
      textAlign: 'right',
      render: (e) => e.averageDailySales.toFixed(2),
    },
    {
      key: 'daysLeft',
      label: 'Jours restants',
      textAlign: 'right',
      render: (e) =>
        e.tier === 'rupture' ? (
          <Badge color="error" variant="light">
            Rupture
          </Badge>
        ) : e.daysUntilStockout === null ? (
          <Text size="sm" c="dimmed">
            —
          </Text>
        ) : (
          <Badge color={e.daysUntilStockout < 7 ? 'error' : 'warning'} variant="light">
            {e.daysUntilStockout} j
          </Badge>
        ),
    },
    {
      key: 'actions',
      label: '',
      textAlign: 'right',
      render: (e) => (
        <Group gap="xs" justify="flex-end" wrap="nowrap">
          <Button variant="subtle" size="xs" onClick={() => navigate(`/products/${e.product.id}`)}>
            Voir
          </Button>
          {recommendationByProduct.has(e.product.id) && (
            <Button variant="light" size="xs" onClick={() => handlePrepareOrder(e.product.id)}>
              Réapprovisionner
            </Button>
          )}
        </Group>
      ),
    },
  ];

  const dailyBuckets = useMemo(() => bucketSalesByDay(sales, products, from, to), [sales, products, from, to]);
  const periodSalesCount = dailyBuckets.reduce((sum, b) => sum + b.salesCount, 0);
  const prevDailyBuckets = useMemo(
    () => bucketSalesByDay(sales, products, prevFrom, prevTo),
    [sales, products, prevFrom, prevTo],
  );
  const prevPeriodSalesCount = prevDailyBuckets.reduce((sum, b) => sum + b.salesCount, 0);

  const dashboardAlerts = useMemo(
    () =>
      buildAlerts({
        stockHealth,
        fraudAnomalies,
        purchaseRecommendations,
        productsToPush,
        crossSell,
        pendingOrders: purchaseOrders.filter((o) => o.status === PurchaseOrderStatus.PENDING),
      }),
    [stockHealth, fraudAnomalies, purchaseRecommendations, productsToPush, crossSell, purchaseOrders],
  );
  const criticalAlertCount = dashboardAlerts.filter((a) => a.severity === 'critical').length;
  const warningAlertCount = dashboardAlerts.filter((a) => a.severity === 'warning').length;
  const opportunityAlertCount = dashboardAlerts.filter((a) => a.severity === 'opportunity').length;

  const revenueChangeRatio = summary && prevSummary ? changeRatio(summary.totalRevenue, prevSummary.totalRevenue) : null;
  const copilotSummary = buildCopilotSummary({
    revenueChangeRatio,
    criticalCount: criticalAlertCount,
    warningCount: warningAlertCount,
    opportunityCount: opportunityAlertCount,
    periodLabel,
  });

  const perfSeries = useMemo(
    () => buildPerformanceSeries(dailyBuckets, prevDailyBuckets, perfMetric),
    [dailyBuckets, prevDailyBuckets, perfMetric],
  );
  const perfChartData = perfSeries.map((p) => ({
    label: p.label,
    'Période actuelle': p.current,
    'Période précédente': p.previous,
  }));

  const isLoading =
    isProductsLoading ||
    isPurchaseOrdersLoading ||
    isSalesLoading ||
    (canSeeFinance && isSummaryLoading);

  return (
    <>
      <PageHeader
        title={`Bonjour, ${user?.firstName} 👋`}
        description="Voici un aperçu de votre activité."
        action={
          <Group gap="xs" wrap="wrap" justify="flex-end">
            <SegmentedControl
              value={period}
              onChange={(value) => setPeriod(value as PeriodKey)}
              data={[
                ...Object.entries(PERIODS).map(([value, { label }]) => ({ value, label })),
                { value: 'custom', label: 'Personnalisé' },
              ]}
            />
            {period === 'custom' && (
              <Group gap="xs">
                <DatePickerInput
                  placeholder="Du"
                  value={customRange[0]}
                  onChange={(date) => setCustomRange([date, customRange[1]])}
                  clearable
                  w={140}
                />
                <DatePickerInput
                  placeholder="Au"
                  value={customRange[1]}
                  onChange={(date) => setCustomRange([customRange[0], date])}
                  clearable
                  w={140}
                />
              </Group>
            )}
          </Group>
        }
      />

      {showWelcomeBanner && (
        <Card mb="xl" withBorder style={{ borderColor: 'var(--mantine-color-emerald-3)' }}>
          <Group justify="space-between" align="flex-start" mb="xs">
            <Group gap="xs">
              <IconSparkles size={18} color="var(--mantine-color-emerald-6)" />
              <Title order={5}>Bienvenue dans votre espace 👋</Title>
            </Group>
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={dismissWelcomeBanner} aria-label="Masquer">
              <IconX size={16} />
            </ActionIcon>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Voici quelques premières actions pour bien démarrer.
          </Text>
          <Group gap="lg">
            {[
              { done: products.length > 0, label: 'Ajouter vos produits', to: '/products' },
              { done: suppliers.length > 0, label: 'Ajouter vos fournisseurs', to: '/purchases' },
              { done: sales.length > 0, label: 'Enregistrer votre première vente', to: '/sales' },
            ].map((item) => (
              <UnstyledButton key={item.label} component={Link} to={item.to}>
                <Group gap={6}>
                  {item.done ? (
                    <IconCircleCheck size={16} color="var(--mantine-color-emerald-6)" />
                  ) : (
                    <Center w={16} h={16} style={{ borderRadius: '50%', border: '2px solid var(--mantine-color-gray-4)' }} />
                  )}
                  <Text size="sm" td={item.done ? 'line-through' : undefined} c={item.done ? 'dimmed' : undefined}>
                    {item.label}
                  </Text>
                </Group>
              </UnstyledButton>
            ))}
          </Group>
        </Card>
      )}

      {isLoading ? (
        <Center py="xl" mb="xl">
          <Loader size="sm" />
        </Center>
      ) : isOrgEmpty ? (
        <Card mb="xl">
          <EmptyState
            icon={IconSparkles}
            title="Bienvenue sur Copilote IA Business !"
            description="Votre tableau de bord s'activera dès que vous aurez ajouté des produits et enregistré vos premières ventes."
            action={canManageStock ? { label: 'Ajouter un produit', onClick: openProductModal } : undefined}
          />
        </Card>
      ) : (
        <>
          <Title order={4} mb="sm">
            Santé de l'entreprise
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} mb="xl">
            {canSeeFinance && summary && (
              <KpiCard
                icon={IconCash}
                label="Chiffre d'affaires"
                value={formatCurrency(summary.totalRevenue)}
                changeRatio={revenueChangeRatio}
                sparkline={dailyBuckets.map((b) => b.revenue)}
                tooltip="Somme des ventes enregistrées sur la période sélectionnée."
                to="/finance"
              />
            )}
            {canSeeFinance && summary && (
              <KpiCard
                icon={IconWallet}
                label="Bénéfice net"
                value={formatCurrency(summary.netProfit)}
                changeRatio={prevSummary ? changeRatio(summary.netProfit, prevSummary.netProfit) : null}
                tooltip="Chiffre d'affaires moins coût des produits vendus et dépenses, estimé à partir du prix d'achat courant."
                to="/finance"
              />
            )}
            <KpiCard
              icon={IconReceipt}
              label="Nombre de ventes"
              value={String(periodSalesCount)}
              changeRatio={changeRatio(periodSalesCount, prevPeriodSalesCount)}
              sparkline={dailyBuckets.map((b) => b.salesCount)}
              to="/sales"
            />
            <KpiCard
              icon={IconBoxSeam}
              label="Valeur du stock"
              value={formatCurrency(stockHealth.totalValue)}
              tooltip="Quantité en stock × prix d'achat courant, tous produits confondus."
              to="/products"
            />
            <KpiCard
              icon={IconAlertTriangle}
              label="Produits à surveiller"
              value={String(stockHealth.ruptureCount + stockHealth.soonCount)}
              invertTrend
              tooltip="Produits en rupture de stock ou ayant atteint leur seuil minimum."
              to="/stock"
            />
          </SimpleGrid>

          <Title order={4} mb="sm">
            Ce que vous devez savoir
          </Title>
          {dashboardAlerts.length === 0 ? (
            <Card mb="xl">
              <EmptyState
                icon={IconCircleCheck}
                title="Tout va bien pour le moment."
                description="Aucune alerte ni anomalie détectée sur votre activité récente."
              />
            </Card>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} mb="xl">
              {dashboardAlerts.map((alert) => (
                <RecommendationCard
                  key={alert.id}
                  severity={alert.severity}
                  icon={ALERT_ICONS[alert.id] ?? IconAlertTriangle}
                  label={SEVERITY_LABELS[alert.severity]}
                  title={alert.title}
                  description={alert.description}
                  actions={[{ label: alert.actionLabel, onClick: () => navigate(alert.actionTo) }]}
                />
              ))}
            </SimpleGrid>
          )}

          {canSeeFinance && (
            <Card mb="xl">
              <Group justify="space-between" mb="md" align="flex-start">
                <Group gap="xs">
                  <IconSparkles size={18} color="var(--mantine-color-emerald-6)" />
                  <Title order={5}>Le Copilote</Title>
                </Group>
                <Button
                  variant="light"
                  size="xs"
                  onClick={() => dailyReport.mutate()}
                  loading={dailyReport.isPending}
                >
                  {dailyReport.data ? 'Actualiser' : 'Analyse complète'}
                </Button>
              </Group>
              {dailyReport.data ? <ReactMarkdown>{dailyReport.data.report}</ReactMarkdown> : <Text size="sm">{copilotSummary}</Text>}
            </Card>
          )}

          {canSeeFinance && (
            <>
              <Title order={4} mb="sm">
                Performance commerciale
              </Title>
              {perfChartData.length < 2 ? (
                <Card mb="xl">
                  <Text size="sm" c="dimmed">
                    Sélectionnez une période de plusieurs jours pour voir une tendance.
                  </Text>
                </Card>
              ) : (
                <Card mb="xl">
                  <Group justify="space-between" mb="md" wrap="wrap">
                    <Title order={5}>Évolution</Title>
                    <SegmentedControl
                      size="xs"
                      value={perfMetric}
                      onChange={(value) => setPerfMetric(value as PerformanceMetric)}
                      data={PERF_METRIC_OPTIONS}
                    />
                  </Group>
                  <LineChart
                    h={260}
                    data={perfChartData}
                    dataKey="label"
                    series={[
                      { name: 'Période actuelle', color: 'emerald.6' },
                      { name: 'Période précédente', color: 'blue.6' },
                    ]}
                    curveType="linear"
                    strokeWidth={2}
                    valueFormatter={(value) => formatPerfValue(perfMetric, value)}
                  />
                </Card>
              )}
            </>
          )}

          <Title order={4} mb="sm">
            Stock
          </Title>
          <SimpleGrid cols={{ base: 2, sm: 4 }} mb="md">
            <Card padding="sm">
              <Text size="xs" c="dimmed">
                Valeur totale
              </Text>
              <Text size="lg" fw={700}>
                {formatCurrency(stockHealth.totalValue)}
              </Text>
            </Card>
            <Card padding="sm">
              <Text size="xs" c="dimmed">
                Unités en stock
              </Text>
              <Text size="lg" fw={700}>
                {stockHealth.totalUnits}
              </Text>
            </Card>
            <Card padding="sm">
              <Text size="xs" c="dimmed">
                Ruptures
              </Text>
              <Text size="lg" fw={700} c={stockHealth.ruptureCount > 0 ? 'error.7' : undefined}>
                {stockHealth.ruptureCount}
              </Text>
            </Card>
            <Card padding="sm">
              <Text size="xs" c="dimmed">
                Bientôt en rupture
              </Text>
              <Text size="lg" fw={700} c={stockHealth.soonCount > 0 ? 'warning.7' : undefined}>
                {stockHealth.soonCount}
              </Text>
            </Card>
          </SimpleGrid>
          <Card mb="xl">
            <Group justify="space-between" mb="md">
              <Title order={5}>Produits nécessitant votre attention</Title>
              <Button component={Link} to="/stock" variant="subtle" size="xs">
                Voir tout le stock
              </Button>
            </Group>
            {stockAttention.length === 0 ? (
              <EmptyState
                icon={IconCircleCheck}
                title="Aucun produit ne nécessite d'attention."
                description="Tous vos stocks sont à un niveau normal."
              />
            ) : (
              <DataTable columns={attentionColumns} rows={stockAttention} rowKey={(e) => e.product.id} />
            )}
          </Card>

          {canSeeFinance && (
            <>
              <Title order={4} mb="sm">
                Top produits
              </Title>
              <SimpleGrid cols={{ base: 1, lg: decliningProducts.length > 0 ? 2 : 1 }} mb="xl">
                <Card>
                  <Group justify="space-between" mb="md">
                    <Title order={5}>Produits les plus vendus</Title>
                    <Text size="xs" c="dimmed">
                      {periodLabel}
                    </Text>
                  </Group>
                  {isTopProductsLoading ? (
                    <Loader size="sm" />
                  ) : (topProducts ?? []).length === 0 ? (
                    <Text size="sm" c="dimmed">
                      Aucune vente sur cette période.
                    </Text>
                  ) : (
                    <Stack gap={4}>
                      {(topProducts ?? []).slice(0, 5).map((p) => (
                        <UnstyledButton key={p.productId} onClick={() => navigate(`/products/${p.productId}`)}>
                          <Group justify="space-between" py={4}>
                            <Text size="sm">{p.productName}</Text>
                            <Text size="sm" fw={600} c="emerald.7">
                              {formatCurrency(p.estimatedMargin)}
                            </Text>
                          </Group>
                        </UnstyledButton>
                      ))}
                    </Stack>
                  )}
                </Card>

                {decliningProducts.length > 0 && (
                  <Card>
                    <Title order={5} mb="md">
                      Produits à surveiller
                    </Title>
                    <Stack gap={4}>
                      {decliningProducts.map((p) => (
                        <UnstyledButton key={p.productId} onClick={() => navigate(`/products/${p.productId}`)}>
                          <Group justify="space-between" py={4}>
                            <Text size="sm">{p.productName}</Text>
                            <Badge color="error" variant="light">
                              {(p.changeRatio * 100).toFixed(0)} %
                            </Badge>
                          </Group>
                        </UnstyledButton>
                      ))}
                    </Stack>
                  </Card>
                )}
              </SimpleGrid>
            </>
          )}

          <Title order={4} mb="sm">
            Activité récente
          </Title>
          <Card mb="xl">
            {activity.length === 0 ? (
              <EmptyState
                icon={IconHistory}
                title="Aucune activité récente."
                description="Les ventes, réceptions et mouvements de stock apparaîtront ici."
              />
            ) : (
              <Timeline bulletSize={22} lineWidth={2}>
                {activity.map((item) => {
                  const ItemIcon = ACTIVITY_ICONS[item.type];
                  const actorName = item.actorUserId ? userNameById.get(item.actorUserId) : undefined;
                  const amountLabel = formatActivityAmount(item);
                  return (
                    <Timeline.Item key={item.id} bullet={<ItemIcon size={12} />}>
                      <UnstyledButton onClick={() => navigate(item.linkTo)}>
                        <Text size="sm" fw={600}>
                          {item.title}
                        </Text>
                      </UnstyledButton>
                      <Group gap={6}>
                        <Text size="xs" c="dimmed">
                          {formatDate(item.date)}
                        </Text>
                        {amountLabel && (
                          <Text size="xs" fw={600}>
                            {amountLabel}
                          </Text>
                        )}
                        {actorName && (
                          <Text size="xs" c="dimmed">
                            par {actorName}
                          </Text>
                        )}
                      </Group>
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            )}
          </Card>
        </>
      )}

      <Title order={4} mb="sm">
        Actions rapides
      </Title>
      <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} mb="xl">
        {quickActions.map((action) => (
          <Card
            key={action.label}
            component="button"
            onClick={action.onClick}
            padding="lg"
            style={{ textAlign: 'left', cursor: 'pointer' }}
          >
            <action.icon size={28} />
            <Text fw={600} mt="sm">
              {action.label}
            </Text>
            <Text size="sm" c="dimmed">
              {action.description}
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      <SaleFormModal opened={saleModalOpened} onClose={closeSaleModal} />
      <ProductFormModal opened={productModalOpened} onClose={closeProductModal} />
      <StockMovementFormModal opened={movementModalOpened} onClose={closeMovementModal} />
      <PurchaseOrderFormModal
        opened={orderModalOpened}
        onClose={() => {
          closeOrderModal();
          setPrefill(null);
        }}
        initialItem={prefill?.item}
        initialSupplierId={prefill?.supplierId}
      />
    </>
  );
}
