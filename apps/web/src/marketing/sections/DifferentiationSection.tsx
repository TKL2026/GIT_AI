import { Card, Container, List, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconCheck, IconCircleDashed, IconSparkles, IconX } from '@tabler/icons-react';
import { Reveal } from '../Reveal';

const CLASSIC = [
  { label: 'Stock', included: true },
  { label: 'Ventes', included: true },
  { label: 'Données', included: true },
  { label: 'Analyse limitée', included: false },
  { label: 'Peu de recommandations', included: false },
  { label: 'Décisions manuelles', included: false },
];

const COPILOT = [
  { label: 'Stock', included: true },
  { label: 'Ventes', included: true },
  { label: 'Achats', included: true },
  { label: 'Finance', included: true },
  { label: 'Analyse IA', included: true },
  { label: 'Alertes', included: true },
  { label: 'Recommandations', included: true },
  { label: 'Pilotage intelligent', included: true },
];

export function DifferentiationSection() {
  return (
    <Container size="lg" py={80} id="differenciation">
      <Stack gap="xl">
        <Reveal>
          <Stack gap="xs" maw={680}>
            <Title order={2} fz={{ base: 26, sm: 32 }}>
              Plus qu'un logiciel de gestion.
            </Title>
          </Stack>
        </Reveal>

        <Reveal delay={80}>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <Card padding="xl" className="hoverLift">
              <ThemeIcon color="gray" variant="light" radius="xl" size={36} mb="md">
                <IconCircleDashed size={18} />
              </ThemeIcon>
              <Text fw={600} mb="sm" c="dimmed">
                Gestion classique
              </Text>
              <List spacing="xs" size="sm" c="dimmed" listStyleType="none">
                {CLASSIC.map((item) => (
                  <List.Item
                    key={item.label}
                    icon={
                      <ThemeIcon color={item.included ? 'emerald' : 'gray'} variant="light" radius="xl" size={20}>
                        {item.included ? <IconCheck size={12} /> : <IconX size={12} />}
                      </ThemeIcon>
                    }
                  >
                    {item.label}
                  </List.Item>
                ))}
              </List>
            </Card>

            <Card padding="xl" className="hoverLift" style={{ borderColor: 'var(--mantine-color-emerald-4)' }}>
              <ThemeIcon color="emerald" variant="light" radius="xl" size={36} mb="md">
                <IconSparkles size={18} />
              </ThemeIcon>
              <Text fw={600} mb="sm">
                UGE
              </Text>
              <List spacing="xs" size="sm" listStyleType="none">
                {COPILOT.map((item) => (
                  <List.Item
                    key={item.label}
                    icon={
                      <ThemeIcon color="emerald" variant="light" radius="xl" size={20}>
                        <IconCheck size={12} />
                      </ThemeIcon>
                    }
                  >
                    {item.label}
                  </List.Item>
                ))}
              </List>
            </Card>
          </SimpleGrid>
        </Reveal>
      </Stack>
    </Container>
  );
}
