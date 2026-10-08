import { Badge, Container, Group, Stack, Text, Title } from '@mantine/core';
import { Reveal } from '../Reveal';

const AUDIENCES = [
  'Boutiques',
  'Commerces',
  'Grossistes',
  'Distributeurs',
  'Restaurants',
  'PME',
  'Entreprises avec plusieurs collaborateurs',
];

export function AudienceSection() {
  return (
    <Container size="lg" py={80} id="audience">
      <Reveal>
        <Stack gap="xl" align="center">
          <Stack gap="xs" maw={640} ta="center">
            <Title order={2} fz={{ base: 26, sm: 32 }}>
              Pensé pour les entreprises qui vendent et qui stockent.
            </Title>
            <Text c="dimmed" size="lg">
              Que vous soyez une PME en France, en Europe ou en Afrique, UGE
              s'adapte à votre activité.
            </Text>
          </Stack>

          <Group justify="center" gap="xs" maw={720}>
            {AUDIENCES.map((audience) => (
              <Badge key={audience} size="lg" variant="light" color="gray" radius="sm" tt="none" fw={500}>
                {audience}
              </Badge>
            ))}
          </Group>
        </Stack>
      </Reveal>
    </Container>
  );
}
