import { Card, Container, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconNews } from '@tabler/icons-react';
import { Seo } from '../../components/Seo';
import '../marketing.css';
import { MarketingFooter } from '../MarketingFooter';
import { MarketingHeader } from '../MarketingHeader';
import { Reveal } from '../Reveal';

export function ActualitesPage() {
  return (
    <>
      <Seo
        title="UGE | Actualités"
        description="Les actualités, nouveautés et évolutions du logiciel de gestion d'entreprise UGE."
        path="/actualites"
      />
      <MarketingHeader />
      <main>
        <Container size="md" py={{ base: 48, sm: 72 }}>
          <Reveal>
            <Stack gap="md" maw={680}>
              <Title order={1} fz={{ base: 28, sm: 38 }}>
                Actualités UGE
              </Title>
              <Text c="dimmed" size="lg">
                Retrouvez ici les nouveautés, évolutions et annonces concernant UGE. Cette section
                vient d'être créée et accueillera progressivement de vrais articles, chacun avec sa
                propre page.
              </Text>
            </Stack>
          </Reveal>

          <Reveal delay={60}>
            <Card withBorder padding="xl" mt="xl" radius="lg">
              <Stack align="center" ta="center" gap="sm" py="md">
                <ThemeIcon color="emerald" variant="light" size={48} radius="xl">
                  <IconNews size={24} />
                </ThemeIcon>
                <Text fw={600}>Aucun article publié pour le moment</Text>
                <Text size="sm" c="dimmed" maw={420}>
                  Revenez bientôt : les prochaines nouveautés de UGE seront annoncées ici.
                </Text>
              </Stack>
            </Card>
          </Reveal>
        </Container>
      </main>
      <MarketingFooter />
    </>
  );
}
