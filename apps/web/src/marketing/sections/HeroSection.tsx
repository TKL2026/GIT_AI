import { Badge, Button, Card, Container, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconArrowRight, IconPackage, IconSparkles, IconTrendingUp, type Icon } from '@tabler/icons-react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ProductMockup } from '../ProductMockup';

function FloatingCard({
  icon: IconComponent,
  color,
  title,
  description,
  style,
}: {
  icon: Icon;
  color: string;
  title: string;
  description: string;
  style: CSSProperties;
}) {
  return (
    <Card
      shadow="md"
      radius="lg"
      padding="sm"
      withBorder
      w={210}
      className="floatSlow"
      style={{ position: 'absolute', ...style }}
      visibleFrom="md"
    >
      <Group gap="xs" wrap="nowrap">
        <ThemeIcon color={color} variant="light" radius="xl" size={32}>
          <IconComponent size={16} />
        </ThemeIcon>
        <div>
          <Text size="xs" fw={600}>
            {title}
          </Text>
          <Text size="xs" c="dimmed">
            {description}
          </Text>
        </div>
      </Group>
    </Card>
  );
}

export function HeroSection() {
  return (
    <Container size="lg" py={{ base: 50, md: 90 }}>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={60} verticalSpacing={60}>
        <Stack justify="center" gap="lg">
          <Badge variant="light" color="emerald" size="lg" radius="sm" w="fit-content">
            Copilote IA intégré
          </Badge>
          <Title order={1} fz={{ base: 32, sm: 40, md: 46 }} lh={1.15}>
            Votre entreprise travaille.
            <br />
            <Text component="span" inherit c="emerald.7">
              Votre Copilote IA l'analyse.
            </Text>
          </Title>
          <Text size="lg" c="dimmed" maw={480}>
            Stock, ventes, achats, finance et intelligence artificielle réunis dans un seul espace
            pour vous aider à mieux piloter votre activité.
          </Text>
          <Group gap="sm">
            <Button component={Link} to="/register" size="md" rightSection={<IconArrowRight size={16} />}>
              Essayer gratuitement
            </Button>
            <Button component="a" href="#comment-ca-marche" size="md" variant="default">
              Voir comment ça fonctionne
            </Button>
          </Group>
          <Text size="xs" c="dimmed">
            Aucune carte bancaire requise.
          </Text>
        </Stack>

        <div style={{ position: 'relative' }}>
          <ProductMockup label="Aperçu — Dashboard UGE" minHeight={320} src="/screenshots/dashboard.png" />
          <FloatingCard
            icon={IconPackage}
            color="error"
            title="2 produits en stock faible"
            description="Riz 25kg, Sel 1kg"
            style={{ top: -18, left: -18 }}
          />
          <FloatingCard
            icon={IconSparkles}
            color="emerald"
            title="Recommandation IA"
            description="Réapprovisionner Huile 5L"
            style={{ bottom: -18, right: -18 }}
          />
          <FloatingCard
            icon={IconTrendingUp}
            color="blue"
            title="Chiffre d'affaires en hausse"
            description="+18 % vs semaine dernière"
            style={{ top: '42%', right: -30 }}
          />
        </div>
      </SimpleGrid>
    </Container>
  );
}
