import { Button, Container, Paper, Stack, Text, Title } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Reveal } from '../Reveal';

export function FinalCtaSection() {
  return (
    <Container size="lg" py={80}>
      <Reveal>
        <Paper radius="lg" p={{ base: 'xl', sm: 60 }} style={{ background: 'var(--mantine-color-emerald-9)' }}>
          <Stack align="center" ta="center" gap="md">
            <Title order={2} c="white" fz={{ base: 26, sm: 34 }}>
              Prêt à mieux piloter votre entreprise ?
            </Title>
            <Text c="emerald.1" size="lg" maw={480}>
              Centralisez votre activité et laissez votre Copilote IA vous aider à prendre de
              meilleures décisions.
            </Text>
            <Button
              component={Link}
              to="/register"
              size="md"
              color="white"
              variant="white"
              c="emerald.9"
              rightSection={<IconArrowRight size={16} />}
            >
              Commencer gratuitement
            </Button>
          </Stack>
        </Paper>
      </Reveal>
    </Container>
  );
}
