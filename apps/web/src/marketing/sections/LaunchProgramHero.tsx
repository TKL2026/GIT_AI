import { Badge, Button, Card, Container, List, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { Reveal } from '../Reveal';

const LAUNCH_PROGRAM_FEATURES = [
  'Toutes les fonctionnalités Pro incluses, sans restriction',
  'Gestion complète : produits, stock, ventes, achats, fournisseurs, finances',
  'Dashboard, rapports et indicateurs détaillés',
  'Prévisions de réapprovisionnement et détection de fraude',
  'Recommandations commerciales et d’achat, Copilote IA',
  '700 requêtes Copilote IA par mois et par utilisateur',
  'Utilisateurs illimités',
];

export function LaunchProgramHero({ onStart }: { onStart: () => void }) {
  return (
    <Container size="sm" py={40} id="tarifs">
      <Reveal>
        <Card
          padding="xl"
          radius="lg"
          withBorder
          style={{ borderColor: 'var(--mantine-color-emerald-6)', borderWidth: 2 }}
        >
          <Stack gap="md" align="center" ta="center">
            <Badge color="emerald" variant="filled" size="lg" radius="sm">
              OFFRE SPÉCIALE DE LANCEMENT – CAMEROUN
            </Badge>

            <Title order={2} fz={{ base: 26, sm: 32 }} maw={480}>
              3 mois pour transformer la gestion de votre entreprise
            </Title>

            <Text fw={800} fz={{ base: 40, sm: 56 }} c="emerald.6" style={{ lineHeight: 1 }}>
              3 MOIS GRATUITS
            </Text>

            <Text c="dimmed" size="lg" maw={520}>
              Testez UGE en conditions réelles, avec l’accès complet (niveau Pro), pendant 90 jours.
            </Text>

            <List spacing="sm" size="md" ta="left" w="100%" maw={440} mt="xs">
              {LAUNCH_PROGRAM_FEATURES.map((feature) => (
                <List.Item
                  key={feature}
                  icon={
                    <ThemeIcon color="emerald" variant="light" size={22} radius="xl">
                      <IconCheck size={14} />
                    </ThemeIcon>
                  }
                >
                  {feature}
                </List.Item>
              ))}
            </List>

            <Button size="lg" onClick={onStart} fullWidth maw={320} mt="sm">
              Commencer gratuitement
            </Button>

            <Text size="sm" c="dimmed">
              Sans carte bancaire · Sans engagement · Aucune facturation automatique
            </Text>
          </Stack>
        </Card>
      </Reveal>
    </Container>
  );
}
