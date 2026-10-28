import { Badge, Divider, Group, Loader, Modal, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { formatCurrency } from '../../lib/format';
import { useDailyReport } from '../../hooks/useReports';

interface DailyReportDetailModalProps {
  date: string | null;
  onClose: () => void;
}

export function DailyReportDetailModal({ date, onClose }: DailyReportDetailModalProps) {
  const { data: report, isLoading } = useDailyReport(date ?? undefined, date !== null);

  return (
    <Modal opened={date !== null} onClose={onClose} title="Rapport journalier" size="lg">
      {isLoading || !report ? (
        <Loader size="sm" />
      ) : (
        <Stack gap="md">
          <div>
            <Title order={4}>{report.organizationName}</Title>
            <Text c="dimmed" size="sm">
              {report.dateLabel}
            </Text>
          </div>

          {!report.hasActivity ? (
            <Text size="sm" c="dimmed">
              Aucune activité (vente) enregistrée ce jour-là.
            </Text>
          ) : (
            <>
              <SimpleGrid cols={2}>
                <Text size="sm">
                  <b>Chiffre d'affaires :</b> {formatCurrency(report.totalRevenue)}
                </Text>
                <Text size="sm">
                  <b>Ventes :</b> {report.salesCount}
                </Text>
                <Text size="sm">
                  <b>Coût des marchandises vendues :</b> {formatCurrency(report.totalCogs)}
                </Text>
                <Text size="sm">
                  <b>Marge brute :</b> {formatCurrency(report.grossMargin)}
                </Text>
                <Text size="sm">
                  <b>Dépenses :</b> {formatCurrency(report.totalExpenses)}
                </Text>
                <Text size="sm">
                  <b>Bénéfice net :</b> {formatCurrency(report.netProfit)}
                </Text>
              </SimpleGrid>

              {report.topProducts.length > 0 && (
                <>
                  <Divider label="Produits les plus rentables" labelPosition="left" />
                  <Stack gap={4}>
                    {report.topProducts.map((product) => (
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
                </>
              )}
            </>
          )}

          <Divider label="Alertes stock" labelPosition="left" />
          {report.stockAlerts.length === 0 ? (
            <Text size="sm" c="dimmed">
              Aucune alerte, tous les produits sont au-dessus de leur seuil.
            </Text>
          ) : (
            <Stack gap={4}>
              {report.stockAlerts.map((alert) => (
                <Group key={alert.productId} justify="space-between">
                  <Text size="sm">{alert.productName}</Text>
                  <Badge color={alert.status === 'out' ? 'error' : 'warning'} variant="light">
                    {alert.status === 'out' ? 'Rupture' : 'Stock bas'} ({alert.stockQuantity})
                  </Badge>
                </Group>
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </Modal>
  );
}
