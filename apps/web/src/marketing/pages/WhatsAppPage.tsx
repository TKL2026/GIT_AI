import { Container, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconArrowRight, IconBrandWhatsapp, IconMessageChatbot, IconUser } from '@tabler/icons-react';
import { Seo } from '../../components/Seo';
import '../marketing.css';
import { FeatureGrid, type FeatureItem } from '../FeatureGrid';
import { MarketingCta } from '../MarketingCta';
import { MarketingFooter } from '../MarketingFooter';
import { MarketingHeader } from '../MarketingHeader';
import { Reveal } from '../Reveal';
import { WhatsAppMockup } from '../WhatsAppMockup';

const FEATURES: FeatureItem[] = [
  {
    icon: IconMessageChatbot,
    title: 'Rapport quotidien sur WhatsApp',
    description:
      "Recevez le résumé de votre activité directement sur WhatsApp, sans avoir à ouvrir le tableau de bord.",
  },
  {
    icon: IconBrandWhatsapp,
    title: 'Questions au Copilote depuis WhatsApp',
    description:
      "Posez une question à votre Copilote IA directement depuis WhatsApp et recevez une réponse basée sur vos données réelles.",
  },
];

function FlowStep({ icon: IconComponent, label }: { icon: typeof IconMessageChatbot; label: string }) {
  return (
    <Stack align="center" gap={4}>
      <ThemeIcon color="emerald" variant="light" size={40} radius="xl">
        <IconComponent size={20} />
      </ThemeIcon>
      <Text size="xs" c="dimmed" fw={500}>
        {label}
      </Text>
    </Stack>
  );
}

export function WhatsAppPage() {
  return (
    <>
      <Seo
        title="UGE | Intégration WhatsApp pour votre Copilote IA"
        description="Recevez votre rapport quotidien et posez vos questions au Copilote IA de UGE directement depuis WhatsApp."
        path="/whatsapp"
      />
      <MarketingHeader />
      <main>
        <Container size="lg" py={{ base: 48, sm: 72 }}>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={60} verticalSpacing={40}>
            <Reveal>
              <Stack justify="center" gap="md" h="100%">
                <Group gap={4} wrap="nowrap">
                  <FlowStep icon={IconMessageChatbot} label="Copilote" />
                  <IconArrowRight size={16} color="var(--mantine-color-gray-4)" style={{ marginBottom: 20 }} />
                  <FlowStep icon={IconBrandWhatsapp} label="WhatsApp" />
                  <IconArrowRight size={16} color="var(--mantine-color-gray-4)" style={{ marginBottom: 20 }} />
                  <FlowStep icon={IconUser} label="Dirigeant" />
                </Group>

                <Title order={1} fz={{ base: 28, sm: 38 }}>
                  UGE sur WhatsApp, même loin de votre écran
                </Title>
                <Text c="dimmed" size="lg">
                  L'intégration WhatsApp de UGE vous permet de rester informé et d'interroger votre
                  Copilote IA sans ouvrir votre ordinateur.
                </Text>
              </Stack>
            </Reveal>

            <Reveal delay={100}>
              <WhatsAppMockup />
            </Reveal>
          </SimpleGrid>
        </Container>

        <Container size="lg" pb={{ base: 48, sm: 72 }}>
          <FeatureGrid items={FEATURES} cols={{ base: 1, sm: 2 }} />
        </Container>

        <MarketingCta
          title="Restez connecté à votre activité"
          description="Activez l'intégration WhatsApp depuis votre espace UGE et recevez votre premier rapport quotidien."
        />
      </main>
      <MarketingFooter />
    </>
  );
}
