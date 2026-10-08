import { Card, Container, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import {
  IconBellRinging,
  IconBoxSeam,
  IconBrandWhatsapp,
  IconLayoutDashboard,
  IconMessageChatbot,
  IconReceipt,
  IconReportMoney,
  IconTrendingUp,
  IconTruckDelivery,
  type Icon,
} from '@tabler/icons-react';
import { Reveal } from '../Reveal';

const REASONS: { icon: Icon; title: string; description: string }[] = [
  { icon: IconBoxSeam, title: 'Gestion du stock', description: 'Suivi des quantités et des seuils critiques en temps réel.' },
  { icon: IconReceipt, title: 'Gestion des ventes', description: "Suivi de l'activité commerciale et des clients." },
  { icon: IconTruckDelivery, title: 'Gestion des achats', description: 'Commandes fournisseurs et réapprovisionnement.' },
  { icon: IconReportMoney, title: 'Finance', description: "Chiffre d'affaires, marges et dépenses réunis." },
  { icon: IconLayoutDashboard, title: 'Tableau de bord', description: "Une vue d'ensemble claire de votre activité." },
  { icon: IconMessageChatbot, title: 'Copilote IA', description: 'Une intelligence qui lit vos données pour vous.' },
  { icon: IconBellRinging, title: 'Alertes', description: 'Prévenu automatiquement quand quelque chose compte.' },
  { icon: IconBrandWhatsapp, title: 'WhatsApp', description: 'Informé directement, même loin de votre écran.' },
  { icon: IconTrendingUp, title: 'Analyse et recommandations', description: 'Des données transformées en actions concrètes.' },
];

export function WhySection() {
  return (
    <Container size="lg" py={80}>
      <Stack gap="xl">
        <Reveal>
          <Stack gap="md" maw={720}>
            <Title order={2} fz={{ base: 26, sm: 32 }}>
              Pourquoi UGE ?
            </Title>
            <Text size="lg" fw={500} c="emerald.7">
              « Un outil de gestion qui ne se contente pas d'enregistrer vos données : il vous aide
              à les comprendre et à agir. »
            </Text>
          </Stack>
        </Reveal>

        <Reveal delay={80}>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {REASONS.map((reason) => (
              <Card key={reason.title} padding="lg" className="hoverLift">
                <ThemeIcon color="emerald" variant="light" radius="md" size={36} mb="sm">
                  <reason.icon size={18} />
                </ThemeIcon>
                <Text fw={600} size="sm">
                  {reason.title}
                </Text>
                <Text size="sm" c="dimmed">
                  {reason.description}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </Reveal>
      </Stack>
    </Container>
  );
}
