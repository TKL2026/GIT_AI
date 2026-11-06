import { Container, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import {
  IconBellRinging,
  IconChartBar,
  IconFileText,
  IconMessageChatbot,
  type Icon,
} from '@tabler/icons-react';
import { ProductMockup } from '../ProductMockup';
import { Reveal } from '../Reveal';

const HIGHLIGHTS: { icon: Icon; label: string }[] = [
  { icon: IconChartBar, label: 'Suivi des ventes et des performances' },
  { icon: IconBellRinging, label: 'Alertes sur les stocks et les activités' },
  { icon: IconFileText, label: 'Rapports détaillés accessibles à tout moment' },
  { icon: IconMessageChatbot, label: 'Copilote IA pour accompagner vos décisions' },
];

export function WhatsAppSection() {
  return (
    <Container size="lg" py={80} id="whatsapp">
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={60} verticalSpacing={40}>
        <Reveal>
          <Stack justify="center" gap="md" h="100%">
            <Title order={2} fz={{ base: 26, sm: 32 }}>
              Gardez le contrôle de votre entreprise, où que vous soyez.
            </Title>
            <Text c="dimmed" size="lg">
              Retrouvez vos indicateurs, suivez vos activités et consultez vos rapports journaliers
              et mensuels directement depuis votre espace UGE.
            </Text>
            <Stack gap="sm">
              {HIGHLIGHTS.map((item) => (
                <Group key={item.label} gap="sm" wrap="nowrap">
                  <ThemeIcon color="emerald" variant="light" radius="xl" size={28}>
                    <item.icon size={15} />
                  </ThemeIcon>
                  <Text size="sm" fw={500}>
                    {item.label}
                  </Text>
                </Group>
              ))}
            </Stack>
          </Stack>
        </Reveal>

        <Reveal delay={100}>
          <ProductMockup label="Aperçu — Rapports UGE" src="/screenshots/reports.png" aspectRatio={2880 / 1180} />
        </Reveal>
      </SimpleGrid>
    </Container>
  );
}
