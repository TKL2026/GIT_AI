import { Container, Stack, Text, Title } from '@mantine/core';
import { Reveal } from '../Reveal';

export function PricingIntroSection() {
  return (
    <Container size="sm" py={80}>
      <Reveal>
        <Stack gap="md" align="center" ta="center">
          <Title order={2} fz={{ base: 26, sm: 34 }}>
            Une tarification pensée pour votre entreprise
          </Title>
          <Text c="dimmed" size="lg" maw={560}>
            Des offres simples, transparentes et accessibles, conçues pour vous donner les outils
            dont votre entreprise a réellement besoin — sans frais cachés, avec un accompagnement
            à la mise en place.
          </Text>
          <Text c="dimmed" size="sm" maw={480}>
            Chaque offre est pensée pour vous permettre de commencer simplement et d'évoluer avec
            votre entreprise.
          </Text>
        </Stack>
      </Reveal>
    </Container>
  );
}
