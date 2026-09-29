import { Button, Stack, Text, ThemeIcon } from '@mantine/core';
import type { Icon } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

interface EmptyStateAction {
  label: string;
  to?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon: Icon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
}

export function EmptyState({ icon: IconComponent, title, description, action }: EmptyStateProps) {
  return (
    <Stack align="center" gap={4} py="xl">
      <ThemeIcon variant="light" radius="xl" size={48} mb="xs">
        <IconComponent size={24} />
      </ThemeIcon>
      <Text fw={600} size="sm" ta="center">
        {title}
      </Text>
      {description && (
        <Text size="sm" c="dimmed" ta="center" maw={320}>
          {description}
        </Text>
      )}
      {action &&
        (action.to ? (
          <Button mt="sm" size="xs" variant="light" component={Link} to={action.to}>
            {action.label}
          </Button>
        ) : (
          <Button mt="sm" size="xs" variant="light" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </Stack>
  );
}
