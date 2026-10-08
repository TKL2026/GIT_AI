import { Button, Container, Paper, Stack, Text, Title } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';

interface MarketingCtaProps {
  title: string;
  description: string;
  buttonLabel?: string;
}

/** Bloc d'appel à l'action réutilisé sur les pages SEO dédiées (même style
 * que FinalCtaSection sur la landing, avec un titre/texte propres à chaque
 * page pour éviter le contenu dupliqué). */
export function MarketingCta({ title, description, buttonLabel = 'Commencer gratuitement' }: MarketingCtaProps) {
  return (
    <Container size="lg" py={80}>
      <Reveal>
        <Paper radius="lg" p={{ base: 'xl', sm: 60 }} style={{ background: 'var(--mantine-color-emerald-9)' }}>
          <Stack align="center" ta="center" gap="md">
            <Title order={2} c="white" fz={{ base: 24, sm: 30 }}>
              {title}
            </Title>
            <Text c="emerald.1" size="lg" maw={520}>
              {description}
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
              {buttonLabel}
            </Button>
          </Stack>
        </Paper>
      </Reveal>
    </Container>
  );
}
