import { Card, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import type { Icon } from '@tabler/icons-react';
import { Reveal } from './Reveal';

export interface FeatureItem {
  icon: Icon;
  title: string;
  description: string;
}

interface FeatureGridProps {
  items: FeatureItem[];
  cols?: { base: number; sm?: number; lg?: number };
}

/** Grille de cartes fonctionnalité réutilisée sur les pages SEO dédiées
 * (/fonctionnalites, /gestion-stock, /copilote-ia...) — un seul composant
 * pour garder un rendu cohérent plutôt que de dupliquer la carte à chaque
 * page. */
export function FeatureGrid({ items, cols = { base: 1, sm: 2, lg: 3 } }: FeatureGridProps) {
  return (
    <SimpleGrid cols={cols} spacing="lg">
      {items.map((item, index) => (
        <Reveal key={item.title} delay={index * 40}>
          <Card padding="lg" h="100%" className="hoverLift">
            <Group gap="sm" wrap="nowrap" align="flex-start">
              <ThemeIcon color="emerald" variant="light" radius="md" size={40}>
                <item.icon size={20} />
              </ThemeIcon>
              <Stack gap={4}>
                <Title order={3} fz="md">
                  {item.title}
                </Title>
                <Text size="sm" c="dimmed">
                  {item.description}
                </Text>
              </Stack>
            </Group>
          </Card>
        </Reveal>
      ))}
    </SimpleGrid>
  );
}
