import { Container, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { ProductMockup } from '../ProductMockup';
import { Reveal } from '../Reveal';

const VISUALS = [
  { label: 'Dashboard', src: '/screenshots/dashboard.png' },
  { label: 'Stock', src: '/screenshots/stock.png' },
  { label: 'Ventes', src: '/screenshots/sales.png' },
  { label: 'Achats', src: '/screenshots/purchases.png' },
  { label: 'Finance', src: '/screenshots/finance.png' },
  { label: 'Copilote IA', src: '/screenshots/copilot.png' },
];

export function ProductProofSection() {
  return (
    <Container size="lg" py={80}>
      <Stack gap="xl">
        <Reveal>
          <Stack gap="xs" maw={640}>
            <Title order={2} fz={{ base: 26, sm: 32 }}>
              Voyez votre activité autrement.
            </Title>
            <Text c="dimmed" size="lg">
              Un aperçu du logiciel réel, tel que vous l'utiliserez au quotidien.
            </Text>
          </Stack>
        </Reveal>

        <Reveal delay={80}>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {VISUALS.map((visual) => (
              <Stack key={visual.label} gap="sm" className="hoverLift">
                <ProductMockup label={`Aperçu — ${visual.label}`} src={visual.src} />
                <Text size="sm" fw={600} ta="center">
                  {visual.label}
                </Text>
              </Stack>
            ))}
          </SimpleGrid>
        </Reveal>
      </Stack>
    </Container>
  );
}
