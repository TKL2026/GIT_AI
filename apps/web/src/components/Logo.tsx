import { Group, Text, ThemeIcon } from '@mantine/core';
import { IconBolt } from '@tabler/icons-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { badge: 26, icon: 16, text: 'md' as const },
  md: { badge: 32, icon: 20, text: 'lg' as const },
  lg: { badge: 44, icon: 28, text: 'xl' as const },
};

export function Logo({ size = 'md' }: LogoProps) {
  const s = SIZES[size];

  return (
    <Group gap="xs" wrap="nowrap">
      <ThemeIcon size={s.badge} radius="md" variant="filled" color="emerald">
        <IconBolt size={s.icon} stroke={2.5} />
      </ThemeIcon>
      <Text size={s.text} fw={800} c="emerald.6" span>
        UGE
      </Text>
    </Group>
  );
}
