import { Card, Text } from '@mantine/core';
import { Link } from 'react-router-dom';

interface StatCardProps {
  label: string;
  value: string;
  color?: string;
  to?: string;
}

export function StatCard({ label, value, color, to }: StatCardProps) {
  const content = (
    <>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="xl" fw={700} c={color}>
        {value}
      </Text>
    </>
  );

  if (to) {
    return (
      <Card component={Link} to={to} withBorder padding="lg" radius="md">
        {content}
      </Card>
    );
  }

  return (
    <Card withBorder padding="lg" radius="md">
      {content}
    </Card>
  );
}
