import { Card, Container, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import {
  IconClockHour4,
  IconDatabaseOff,
  IconHelpOctagon,
  IconMoodConfuzed,
  IconPackageOff,
  type Icon,
} from '@tabler/icons-react';
import { Reveal } from '../Reveal';

const PROBLEMS: { icon: Icon; text: string }[] = [
  { icon: IconPackageOff, text: 'Stock difficile à suivre' },
  { icon: IconDatabaseOff, text: 'Données dispersées' },
  { icon: IconHelpOctagon, text: 'Décisions prises sans données fiables' },
  { icon: IconMoodConfuzed, text: 'Difficulté à comprendre les performances' },
  { icon: IconClockHour4, text: 'Temps perdu dans les tâches répétitives' },
];

export function ProblemSection() {
  return (
    <Container size="lg" py={80}>
      <Stack gap="xl">
        <Reveal>
          <Stack gap="xs" maw={640}>
            <Title order={2} fz={{ base: 26, sm: 32 }}>
              Vous avez les données.
              <br />
              Mais avez-vous vraiment la visibilité ?
            </Title>
            <Text c="dimmed" size="lg">
              La plupart des dirigeants de PME gèrent leur entreprise avec des informations
              incomplètes, dispersées, ou découvertes trop tard.
            </Text>
          </Stack>
        </Reveal>

        <Reveal delay={80}>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {PROBLEMS.map((problem) => (
              <Card key={problem.text} padding="lg" className="hoverLift">
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon color="error" variant="light" radius="xl" size={36}>
                    <problem.icon size={18} />
                  </ThemeIcon>
                  <Text size="sm" fw={500}>
                    {problem.text}
                  </Text>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Reveal>

        <Text ta="center" size="lg" fw={600} c="emerald.7">
          Copilote IA Business transforme ces problèmes en actions concrètes.
        </Text>
      </Stack>
    </Container>
  );
}
