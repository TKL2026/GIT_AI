import { Card, Container, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import {
  IconBoxSeam,
  IconMessageChatbot,
  IconReceipt,
  IconReportMoney,
  IconTruckDelivery,
  type Icon,
} from '@tabler/icons-react';
import { Reveal } from '../Reveal';

const MODULES: { icon: Icon; title: string; description: string }[] = [
  {
    icon: IconBoxSeam,
    title: 'Stock',
    description: 'Suivez vos stocks en temps réel et identifiez les risques de rupture avant qu\'ils ne coûtent une vente.',
  },
  {
    icon: IconReceipt,
    title: 'Ventes',
    description: 'Suivez votre activité commerciale, vos meilleurs produits et vos clients au quotidien.',
  },
  {
    icon: IconTruckDelivery,
    title: 'Achats',
    description: 'Gérez vos fournisseurs, vos commandes et anticipez vos besoins de réapprovisionnement.',
  },
  {
    icon: IconReportMoney,
    title: 'Finance',
    description: 'Comprenez votre chiffre d\'affaires, vos marges, vos dépenses et votre rentabilité réelle.',
  },
  {
    icon: IconMessageChatbot,
    title: 'Copilote IA',
    description: 'Posez des questions à vos propres données et recevez des recommandations concrètes.',
  },
];

export function ProductSection() {
  return (
    <Container size="lg" py={80} id="produit">
      <Stack gap="xl">
        <Reveal>
          <Stack gap="xs" maw={640}>
            <Title order={2} fz={{ base: 26, sm: 32 }}>
              Tout ce dont vous avez besoin pour piloter votre activité.
            </Title>
            <Text c="dimmed" size="lg">
              Chaque module est connecté aux autres — les données ne sont saisies qu'une fois et
              circulent partout où elles sont utiles.
            </Text>
          </Stack>
        </Reveal>

        <Reveal delay={80}>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {MODULES.map((module) => (
              <Card key={module.title} padding="xl" className="hoverLift">
                <ThemeIcon color="emerald" variant="light" radius="md" size={40} mb="md">
                  <module.icon size={20} />
                </ThemeIcon>
                <Text fw={600} size="lg" mb={4}>
                  {module.title}
                </Text>
                <Text size="sm" c="dimmed">
                  {module.description}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </Reveal>
      </Stack>
    </Container>
  );
}
