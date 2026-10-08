import { Card, Container, List, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconBrandWhatsapp, IconCheck, IconPlus } from '@tabler/icons-react';
import { Reveal } from '../Reveal';

export function IntegrationsSection() {
  return (
    <Container size="lg" py={80} id="integrations">
      <Stack gap="xl">
        <Reveal>
          <Stack gap="xs" maw={640}>
            <Title order={2} fz={{ base: 26, sm: 32 }}>
              Intégrations
            </Title>
            <Text c="dimmed" size="lg">
              Les intégrations réellement disponibles aujourd'hui dans UGE.
              D'autres viendront s'ajouter au fil du temps.
            </Text>
          </Stack>
        </Reveal>

        <Reveal delay={80}>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <Card padding="xl" className="hoverLift">
              <ThemeIcon color="emerald" variant="light" radius="xl" size={44} mb="md">
                <IconBrandWhatsapp size={22} />
              </ThemeIcon>
              <Text fw={600} size="lg" mb={4}>
                WhatsApp Business
              </Text>
              <Text size="sm" c="dimmed" mb="sm">
                Ce que cette intégration permet aujourd'hui :
              </Text>
              <List
                spacing="xs"
                size="sm"
                icon={
                  <ThemeIcon color="emerald" variant="light" size={18} radius="xl">
                    <IconCheck size={11} />
                  </ThemeIcon>
                }
              >
                <List.Item>Notifications sur votre activité</List.Item>
                <List.Item>Rapports envoyés directement sur WhatsApp</List.Item>
                <List.Item>Communication avec le Copilote selon les fonctionnalités disponibles</List.Item>
              </List>
            </Card>

            <Card
              padding="xl"
              style={{ border: '1px dashed var(--mantine-color-gray-4)', background: 'var(--mantine-color-gray-0)' }}
            >
              <ThemeIcon color="gray" variant="light" radius="xl" size={44} mb="md">
                <IconPlus size={22} />
              </ThemeIcon>
              <Text fw={600} size="lg" mb={4} c="dimmed">
                D'autres intégrations à venir
              </Text>
              <Text size="sm" c="dimmed">
                Cet espace est prévu pour accueillir de nouvelles intégrations à mesure qu'elles
                seront disponibles.
              </Text>
            </Card>
          </SimpleGrid>
        </Reveal>
      </Stack>
    </Container>
  );
}
