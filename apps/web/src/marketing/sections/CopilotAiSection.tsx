import { Badge, Card, Container, Grid, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import {
  IconBriefcase,
  IconChartLine,
  IconClipboardList,
  IconMessageChatbot,
  IconReportMoney,
  IconShieldCheck,
  IconTruckDelivery,
  type Icon,
} from '@tabler/icons-react';
import { ProductMockup } from '../ProductMockup';
import { Reveal } from '../Reveal';

const EXAMPLE_QUESTIONS = [
  'Quels produits risquent de tomber en rupture ?',
  'Quelles sont mes ventes cette semaine ?',
  'Quels produits devrais-je pousser ?',
  'Y a-t-il une anomalie dans mon activité ?',
  'Quels achats dois-je prévoir ?',
];

const LEFT_CAPABILITIES: { icon: Icon; title: string; description: string }[] = [
  {
    icon: IconClipboardList,
    title: "Directeur d'exploitation",
    description: 'Garde un œil sur l\'ensemble de votre activité et vous signale ce qui compte vraiment.',
  },
  {
    icon: IconChartLine,
    title: 'Prévision',
    description: 'Anticipe vos ruptures de stock et vous dit quoi commander, et quand.',
  },
  {
    icon: IconShieldCheck,
    title: 'Anti-fraude',
    description: 'Repère les anomalies inhabituelles dans vos ventes et vos mouvements de stock.',
  },
];

const RIGHT_CAPABILITIES: { icon: Icon; title: string; description: string }[] = [
  {
    icon: IconReportMoney,
    title: 'Analyste financier',
    description: 'Traduit vos chiffres en marges, rentabilité et tendances compréhensibles.',
  },
  {
    icon: IconBriefcase,
    title: 'Commercial',
    description: 'Identifie les produits à pousser et les opportunités de vente croisée.',
  },
  {
    icon: IconTruckDelivery,
    title: 'Achats',
    description: 'Recommande quoi acheter, en quelle quantité, et auprès de quel fournisseur.',
  },
];

function CapabilityCard({ capability }: { capability: { icon: Icon; title: string; description: string } }) {
  return (
    <Card padding="lg" className="hoverLift">
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <ThemeIcon color="emerald" variant="light" radius="md" size={36}>
          <capability.icon size={18} />
        </ThemeIcon>
        <div>
          <Text fw={600} size="sm">
            {capability.title}
          </Text>
          <Text size="sm" c="dimmed">
            {capability.description}
          </Text>
        </div>
      </Group>
    </Card>
  );
}

export function CopilotAiSection() {
  return (
    <Container size="lg" py={80} id="copilote-ia">
      <Stack gap="xl">
        <Reveal>
          <Stack gap="xs" maw={640}>
            <Title order={2} fz={{ base: 26, sm: 32 }}>
              Un copilote qui connaît réellement votre activité.
            </Title>
            <Text c="dimmed" size="lg">
              Pas un chatbot générique : un copilote qui lit vos vraies données — vos produits, vos
              stocks, vos ventes, vos achats et vos finances — pour répondre avec ce qui se passe
              réellement dans votre entreprise.
            </Text>
          </Stack>
        </Reveal>

        <Reveal delay={80}>
          <Grid gutter="lg" align="stretch">
            <Grid.Col span={{ base: 12, lg: 4 }} order={{ base: 2, lg: 1 }}>
              <Stack gap="lg" h="100%" justify="center">
                {LEFT_CAPABILITIES.map((capability) => (
                  <CapabilityCard key={capability.title} capability={capability} />
                ))}
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, lg: 4 }} order={{ base: 1, lg: 2 }}>
              <Card padding="xl" h="100%" className="hoverLift" style={{ borderColor: 'var(--mantine-color-emerald-4)' }}>
                <Stack gap="md" align="center" ta="center">
                  <ThemeIcon color="emerald" variant="light" size={48} radius="xl">
                    <IconMessageChatbot size={24} />
                  </ThemeIcon>
                  <Text fw={700} size="lg">
                    Le Copilote IA de UGE
                  </Text>
                  <Text size="sm" c="dimmed">
                    Une seule intelligence, connectée à tous vos modules.
                  </Text>
                  <ProductMockup label="Aperçu — Conversation avec le Copilote" src="/screenshots/copilot.png" aspectRatio={4 / 3} />
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, lg: 4 }} order={{ base: 3, lg: 3 }}>
              <Stack gap="lg" h="100%" justify="center">
                {RIGHT_CAPABILITIES.map((capability) => (
                  <CapabilityCard key={capability.title} capability={capability} />
                ))}
              </Stack>
            </Grid.Col>
          </Grid>
        </Reveal>

        <Reveal delay={120}>
          <Stack gap="xs" align="center">
            <Text size="sm" fw={600} c="dimmed">
              Vous pouvez lui demander
            </Text>
            <Group justify="center" gap="xs" maw={780}>
              {EXAMPLE_QUESTIONS.map((question) => (
                <Badge key={question} size="lg" variant="light" color="gray" radius="sm" tt="none" fw={500}>
                  « {question} »
                </Badge>
              ))}
            </Group>
          </Stack>
        </Reveal>
      </Stack>
    </Container>
  );
}
