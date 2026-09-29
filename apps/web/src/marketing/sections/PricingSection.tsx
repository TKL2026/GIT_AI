import { Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { Reveal } from '../Reveal';

export function PricingSection() {
  return (
    <Container size="sm" py={80} id="tarifs">
      <Reveal>
        <Stack gap="md" align="center" ta="center">
          <Title order={2} fz={{ base: 24, sm: 28 }}>
            Une tarification pensée pour votre entreprise.
          </Title>
          <Text c="dimmed" size="lg" maw={480}>
            Que vous soyez une petite entreprise ou une structure en croissance, découvrez une
            solution adaptée à votre activité.
          </Text>
          <Group gap="sm">
            <Button component={Link} to="/register" size="md">
              Commencer gratuitement
            </Button>
            <Button component={Link} to="/contact" size="md" variant="default">
              Parler à l'équipe
            </Button>
          </Group>
        </Stack>
      </Reveal>
    </Container>
  );
}
