import { Container, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconArrowRight, IconBrandWhatsapp, IconMessageChatbot, IconUser } from '@tabler/icons-react';
import { Reveal } from '../Reveal';
import { WhatsAppMockup } from '../WhatsAppMockup';

const EXAMPLES = [
  '⚠️ Stock faible détecté',
  '📊 Rapport quotidien disponible',
  '💡 Opportunité commerciale détectée',
  '🤖 Le Copilote vous recommande…',
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

export function WhatsAppSection() {
  return (
    <Container size="lg" py={80} id="whatsapp">
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

            <Title order={2} fz={{ base: 26, sm: 32 }}>
              Votre entreprise continue de vous informer, même lorsque vous n'êtes pas devant votre
              écran.
            </Title>
            <Text c="dimmed" size="lg">
              Votre entreprise peut vous tenir informé directement sur WhatsApp — même lorsque vous
              n'êtes pas devant votre ordinateur.
            </Text>
            <Stack gap="xs">
              {EXAMPLES.map((item) => (
                <Text key={item} size="sm" fw={500}>
                  {item}
                </Text>
              ))}
            </Stack>
          </Stack>
        </Reveal>

        <Reveal delay={100}>
          <WhatsAppMockup />
        </Reveal>
      </SimpleGrid>
    </Container>
  );
}
