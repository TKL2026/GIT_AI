import { Container, Paper, Stack, Text, Title } from '@mantine/core';
import { Reveal } from '../Reveal';

export function PricingPhilosophySection() {
  return (
    <Container size="md" py={80}>
      <Reveal>
        <Paper radius="lg" p={{ base: 'xl', sm: 60 }} style={{ background: 'var(--mantine-color-emerald-0)' }}>
          <Stack gap="sm" ta="center" align="center">
            <Title order={2} fz={{ base: 24, sm: 28 }}>
              Des tarifs pensés pour créer de la valeur
            </Title>
            <Text c="dimmed" size="lg" maw={620}>
              UGE est conçu pour permettre aux entreprises de commencer avec l'essentiel, puis
              d'évoluer vers des fonctionnalités plus avancées selon leurs besoins. Nos offres sont
              pensées pour rester accessibles tout en donnant accès à des outils professionnels de
              gestion et d'analyse.
            </Text>
          </Stack>
        </Paper>
      </Reveal>
    </Container>
  );
}
