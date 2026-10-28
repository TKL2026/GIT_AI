import {
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { DatePickerInput, MonthPickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import {
  IconCalendarStats,
  IconDownload,
  IconFileText,
  IconReportMoney,
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { EmptyState } from '../../components/EmptyState';
import { KpiCard } from '../../components/KpiCard';
import { PageHeader } from '../../components/PageHeader';
import type { DailyReportListItem } from '../../api/reports';
import {
  useDailyReportsList,
  useDownloadDailyReportPdf,
  useDownloadMonthlyReportPdf,
  useMonthlyReport,
} from '../../hooks/useReports';
import { ApiError } from '../../lib/apiClient';
import { downloadBlob } from '../../lib/downloadBlob';
import { formatCurrency } from '../../lib/format';
import { DailyReportDetailModal } from './DailyReportDetailModal';

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultRange(): [Date, Date] {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 13);
  return [from, to];
}

export function ReportsPage() {
  const [range, setRange] = useState<[Date | null, Date | null]>(defaultRange());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [detailDate, setDetailDate] = useState<string | null>(null);

  const from = range[0] ? toDateString(range[0]) : '';
  const to = range[1] ? toDateString(range[1]) : '';
  const month = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`;

  const { data: dailyList = [], isLoading: isDailyListLoading } = useDailyReportsList(
    from,
    to,
    Boolean(from && to),
  );
  const { data: monthlyReport, isLoading: isMonthlyLoading } = useMonthlyReport(month);

  const downloadDailyPdf = useDownloadDailyReportPdf();
  const downloadMonthlyPdf = useDownloadMonthlyReportPdf();

  function handleDownloadDailyPdf(date: string) {
    downloadDailyPdf.mutate(date, {
      onSuccess: (blob) => downloadBlob(blob, `UGE_Rapport_Journalier_${date}.pdf`),
      onError: (err) => {
        notifications.show({
          color: 'red',
          message: err instanceof ApiError ? err.message : 'Impossible de télécharger le rapport.',
        });
      },
    });
  }

  function handleDownloadMonthlyPdf() {
    downloadMonthlyPdf.mutate(month, {
      onSuccess: (blob) => downloadBlob(blob, `UGE_Rapport_Mensuel_${month}.pdf`),
      onError: (err) => {
        notifications.show({
          color: 'red',
          message: err instanceof ApiError ? err.message : 'Impossible de télécharger le rapport.',
        });
      },
    });
  }

  const dailyColumns: DataTableColumn<DailyReportListItem>[] = useMemo(
    () => [
      {
        key: 'date',
        label: 'Date',
        render: (row) => row.dateLabel,
        sortValue: (row) => row.date,
      },
      {
        key: 'revenue',
        label: "Chiffre d'affaires",
        textAlign: 'right',
        render: (row) =>
          row.hasActivity ? (
            formatCurrency(row.totalRevenue)
          ) : (
            <Text size="sm" c="dimmed">
              Aucune activité
            </Text>
          ),
        sortValue: (row) => row.totalRevenue,
      },
      {
        key: 'salesCount',
        label: 'Ventes',
        textAlign: 'right',
        render: (row) => row.salesCount,
        sortValue: (row) => row.salesCount,
      },
      {
        key: 'actions',
        label: '',
        textAlign: 'right',
        render: (row) => (
          <Group gap="xs" justify="flex-end" wrap="nowrap">
            <Button variant="subtle" size="xs" onClick={() => setDetailDate(row.date)}>
              Détail
            </Button>
            <Button
              variant="light"
              size="xs"
              leftSection={<IconDownload size={14} />}
              onClick={() => handleDownloadDailyPdf(row.date)}
              loading={downloadDailyPdf.isPending}
            >
              PDF
            </Button>
          </Group>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [downloadDailyPdf.isPending],
  );

  return (
    <>
      <PageHeader
        title="Rapports"
        description="Consultez et téléchargez vos rapports journaliers et mensuels."
      />

      <Tabs defaultValue="daily">
        <Tabs.List mb="md">
          <Tabs.Tab value="daily" leftSection={<IconCalendarStats size={16} />}>
            Journalier
          </Tabs.Tab>
          <Tabs.Tab value="monthly" leftSection={<IconReportMoney size={16} />}>
            Mensuel
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="daily">
          <Group mb="md" gap="xs">
            <DatePickerInput
              label="Du"
              value={range[0]}
              onChange={(date) => setRange([date, range[1]])}
              maxDate={range[1] ?? undefined}
              clearable={false}
              w={160}
            />
            <DatePickerInput
              label="Au"
              value={range[1]}
              onChange={(date) => setRange([range[0], date])}
              minDate={range[0] ?? undefined}
              maxDate={new Date()}
              clearable={false}
              w={160}
            />
          </Group>

          <Card>
            <DataTable
              columns={dailyColumns}
              rows={dailyList}
              rowKey={(row) => row.date}
              isLoading={isDailyListLoading}
              emptyMessage="Aucun rapport pour cette période."
            />
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="monthly">
          <Group mb="md" justify="space-between" align="flex-end">
            <MonthPickerInput
              label="Mois"
              value={selectedMonth}
              onChange={(date) => date && setSelectedMonth(date)}
              maxDate={new Date()}
              w={200}
            />
            {monthlyReport?.hasActivity && (
              <Button
                variant="light"
                leftSection={<IconDownload size={16} />}
                onClick={handleDownloadMonthlyPdf}
                loading={downloadMonthlyPdf.isPending}
              >
                Télécharger en PDF
              </Button>
            )}
          </Group>

          {isMonthlyLoading ? (
            <Center py="xl">
              <Loader size="sm" />
            </Center>
          ) : !monthlyReport?.hasActivity ? (
            <Card>
              <EmptyState
                icon={IconFileText}
                title="Aucune activité ce mois-ci."
                description="Aucune vente n'a été enregistrée pour la période sélectionnée."
              />
            </Card>
          ) : (
            <Stack gap="md">
              <Title order={4}>{monthlyReport.monthLabel}</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                <KpiCard icon={IconReportMoney} label="Chiffre d'affaires" value={formatCurrency(monthlyReport.totalRevenue)} />
                <KpiCard icon={IconReportMoney} label="Ventes" value={String(monthlyReport.salesCount)} />
                <KpiCard icon={IconReportMoney} label="Marge brute" value={formatCurrency(monthlyReport.grossMargin)} />
                <KpiCard icon={IconReportMoney} label="Bénéfice net" value={formatCurrency(monthlyReport.netProfit)} />
              </SimpleGrid>

              {monthlyReport.topProducts.length > 0 && (
                <Card>
                  <Title order={5} mb="sm">
                    Produits les plus rentables
                  </Title>
                  <Stack gap={4}>
                    {monthlyReport.topProducts.map((product) => (
                      <Group key={product.productId} justify="space-between">
                        <Text size="sm">
                          {product.productName} ({product.quantitySold} unité{product.quantitySold > 1 ? 's' : ''})
                        </Text>
                        <Text size="sm" fw={600} c="emerald.7">
                          Marge estimée : {formatCurrency(product.estimatedMargin)}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </Card>
              )}

              <Card>
                <Title order={5} mb="sm">
                  Alertes stock
                </Title>
                {monthlyReport.stockAlerts.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    Aucune alerte, tous les produits sont au-dessus de leur seuil.
                  </Text>
                ) : (
                  <Stack gap={4}>
                    {monthlyReport.stockAlerts.map((alert) => (
                      <Group key={alert.productId} justify="space-between">
                        <Text size="sm">{alert.productName}</Text>
                        <Badge color={alert.status === 'out' ? 'error' : 'warning'} variant="light">
                          {alert.status === 'out' ? 'Rupture' : 'Stock bas'} ({alert.stockQuantity})
                        </Badge>
                      </Group>
                    ))}
                  </Stack>
                )}
              </Card>
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>

      <DailyReportDetailModal date={detailDate} onClose={() => setDetailDate(null)} />
    </>
  );
}
