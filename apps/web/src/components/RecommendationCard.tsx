import { Badge, Button, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import type { Icon } from '@tabler/icons-react';

type Severity = 'critical' | 'warning' | 'info' | 'opportunity';

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: 'error',
  warning: 'warning',
  info: 'info',
  opportunity: 'success',
};

interface RecommendationAction {
  label: string;
  onClick: () => void;
  variant?: 'filled' | 'light' | 'subtle';
}

interface RecommendationCardProps {
  severity: Severity;
  icon: Icon;
  label: string;
  title: string;
  description: string;
  actions?: RecommendationAction[];
}

export function RecommendationCard({
  severity,
  icon: IconComponent,
  label,
  title,
  description,
  actions,
}: RecommendationCardProps) {
  const color = SEVERITY_COLORS[severity];

  return (
    <Card h="100%">
      <Stack gap="sm" h="100%">
        <Group justify="space-between" align="flex-start">
          <ThemeIcon color={color} variant="light" radius="md" size="lg">
            <IconComponent size={18} />
          </ThemeIcon>
          <Badge color={color} variant="light" size="sm">
            {label}
          </Badge>
        </Group>
        <div style={{ flex: 1 }}>
          <Text fw={600} size="sm" mb={4}>
            {title}
          </Text>
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        </div>
        {actions && actions.length > 0 && (
          <Group gap="xs">
            {actions.map((action) => (
              <Button
                key={action.label}
                size="xs"
                variant={action.variant ?? 'light'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </Group>
        )}
      </Stack>
    </Card>
  );
}
