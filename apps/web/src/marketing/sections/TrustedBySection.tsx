import { Badge, Box, Container, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { Reveal } from '../Reveal';

export function TrustedBySection() {
  return (
    <Container size="lg" py={80}>
      <Reveal>
        <Stack gap="xl" align="center" ta="center">
          <Badge variant="light" color="emerald" size="lg" radius="sm">
            Phase de lancement
          </Badge>
          <Stack gap="xs" maw={620}>
            <Title order={2} fz={{ base: 24, sm: 28 }}>
              Ils nous font confiance
            </Title>
            <Text c="dimmed" size="lg">
              Copilote IA Business est en phase de lancement et s'ouvre à ses premières
              entreprises. Les témoignages et résultats de nos premiers clients seront présentés
              ici au fur et à mesure.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" w="100%" maw={640}>
            {[1, 2, 3, 4].map((slot) => (
              <Box
                key={slot}
                h={56}
                style={{
                  border: '1px dashed var(--mantine-color-gray-3)',
                  borderRadius: 'var(--mantine-radius-md)',
                }}
              />
            ))}
          </SimpleGrid>
        </Stack>
      </Reveal>
    </Container>
  );
}
