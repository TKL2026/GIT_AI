import { Card, Container, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import {
  IconChecklist,
  IconHeadset,
  IconPackageImport,
  IconSettings,
  IconSparkles,
  type Icon,
} from '@tabler/icons-react';
import { Reveal } from '../Reveal';

const HELP_ITEMS: { icon: Icon; title: string; description: string }[] = [
  {
    icon: IconSettings,
    title: "Création et configuration de l'espace",
    description: 'Nous vous aidons à mettre en place votre organisation UGE dès le départ.',
  },
  {
    icon: IconChecklist,
    title: 'Aide à la prise en main',
    description: "Un accompagnement pour comprendre rapidement comment utiliser l'application.",
  },
  {
    icon: IconPackageImport,
    title: 'Import de vos premiers produits',
    description: 'Un coup de main pour importer ou créer vos premiers produits dans UGE.',
  },
  {
    icon: IconSparkles,
    title: 'Explication des fonctionnalités',
    description: 'Nous présentons les principales fonctionnalités adaptées à votre activité.',
  },
  {
    icon: IconHeadset,
    title: 'Assistance au démarrage',
    description: 'Une assistance disponible pendant vos premiers pas sur UGE.',
  },
];

export function PricingSignupHelpSection() {
  return (
    <Container size="lg" py={80}>
      <Stack gap="xl">
        <Reveal>
          <Stack gap="xs" maw={640} mx="auto" ta="center" align="center">
            <Title order={2} fz={{ base: 24, sm: 30 }}>
              Vous n'êtes pas seul pour démarrer
            </Title>
            <Text c="dimmed" size="lg">
              Nous vous accompagnons dans la mise en place de votre espace UGE afin que vous
              puissiez démarrer dans de bonnes conditions.
            </Text>
          </Stack>
        </Reveal>

        <Reveal delay={80}>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {HELP_ITEMS.map((item) => (
              <Card key={item.title} padding="xl" className="hoverLift">
                <ThemeIcon color="emerald" variant="light" radius="md" size={40} mb="md">
                  <item.icon size={20} />
                </ThemeIcon>
                <Text fw={600} size="lg" mb={4}>
                  {item.title}
                </Text>
                <Text size="sm" c="dimmed">
                  {item.description}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </Reveal>
      </Stack>
    </Container>
  );
}
