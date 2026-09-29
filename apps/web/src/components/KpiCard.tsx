import { Card, Group, Stack, Text, ThemeIcon, Tooltip } from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import { IconInfoCircle, IconTrendingDown, IconTrendingUp, type Icon } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

interface KpiCardProps {
  icon: Icon;
  label: string;
  value: string;
  /** Variation vs période précédente (0.12 = +12%). Omis si non pertinent (valeur ponctuelle). */
  changeRatio?: number | null;
  /** true si une baisse est un signal positif (ex: nombre d'alertes). */
  invertTrend?: boolean;
  to?: string;
  /** Série de valeurs (ex: CA quotidien sur la période) rendue en mini-graphique. Omis si &lt; 2 points. */
  sparkline?: number[];
  /** Explication courte affichée au survol d'une icône info à côté du libellé. */
  tooltip?: string;
}

export function KpiCard({
  icon: IconComponent,
  label,
  value,
  changeRatio,
  invertTrend,
  to,
  sparkline,
  tooltip,
}: KpiCardProps) {
  const showTrend = changeRatio !== undefined && changeRatio !== null;
  const isPositive = showTrend && changeRatio! >= 0;
  const isGood = showTrend && (invertTrend ? !isPositive : isPositive);
  const sparklineData = sparkline && sparkline.length > 1 ? sparkline.map((v, index) => ({ index, v })) : null;
  const sparklineColor = showTrend ? (isGood ? 'emerald.6' : 'error.6') : 'emerald.6';

  const content = (
    <Stack gap="xs">
      <Group justify="space-between" align="flex-start">
        <Group gap={4}>
          <Text size="sm" c="dimmed">
            {label}
          </Text>
          {tooltip && (
            <Tooltip label={tooltip} multiline w={220} withArrow>
              <IconInfoCircle size={14} style={{ opacity: 0.5, cursor: 'help' }} />
            </Tooltip>
          )}
        </Group>
        <ThemeIcon variant="light" radius="md" size="lg">
          <IconComponent size={18} />
        </ThemeIcon>
      </Group>
      <Text size="xl" fw={700}>
        {value}
      </Text>
      {showTrend && (
        <Group gap={4}>
          {isPositive ? (
            <IconTrendingUp size={16} color={isGood ? 'var(--mantine-color-emerald-6)' : 'var(--mantine-color-error-6)'} />
          ) : (
            <IconTrendingDown size={16} color={isGood ? 'var(--mantine-color-emerald-6)' : 'var(--mantine-color-error-6)'} />
          )}
          <Text size="xs" c={isGood ? 'emerald.7' : 'error.7'} fw={600}>
            {isPositive ? '+' : ''}
            {(changeRatio! * 100).toFixed(1)} %
          </Text>
          <Text size="xs" c="dimmed">
            vs période précédente
          </Text>
        </Group>
      )}
      {sparklineData && (
        <AreaChart
          h={32}
          data={sparklineData}
          dataKey="index"
          series={[{ name: 'v', color: sparklineColor }]}
          withXAxis={false}
          withYAxis={false}
          withDots={false}
          withTooltip={false}
          withGradient
          strokeWidth={2}
          gridAxis="none"
        />
      )}
    </Stack>
  );

  return to ? (
    <Card component={Link} to={to}>
      {content}
    </Card>
  ) : (
    <Card>{content}</Card>
  );
}
