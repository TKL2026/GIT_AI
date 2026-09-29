import { Container, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconShieldCheck, IconEyeCheck, IconLock, IconServer, IconShieldLock, IconUsersGroup, type Icon } from '@tabler/icons-react';
import { Reveal } from '../Reveal';

const POINTS: { icon: Icon; title: string; description: string }[] = [
  {
    icon: IconShieldLock,
    title: 'Authentification sécurisée',
    description: 'Connexion protégée par jetons de session avec expiration et renouvellement.',
  },
  {
    icon: IconServer,
    title: 'Données séparées par organisation',
    description: "Chaque entreprise n'accède qu'à ses propres données — jamais celles d'une autre organisation.",
  },
  {
    icon: IconUsersGroup,
    title: 'Gestion des utilisateurs et des rôles',
    description: "Invitez votre équipe et attribuez à chacun le niveau d'accès adapté à son rôle.",
  },
  {
    icon: IconLock,
    title: 'Architecture moderne',
    description: 'Vos données sont centralisées et accessibles en permanence, depuis un seul espace.',
  },
  {
    icon: IconEyeCheck,
    title: 'Accès contrôlé',
    description: "Chaque utilisateur ne voit que ce qui correspond à son rôle et à son organisation.",
  },
  {
    icon: IconShieldCheck,
    title: 'Protection des données',
    description: "Vos informations restent propres à votre organisation et ne sont jamais partagées avec des tiers.",
  },
];

export function TrustSection() {
  return (
    <Paper radius={0} py={80} style={{ background: 'var(--mantine-color-emerald-0)' }} id="securite">
      <Container size="lg">
        <Stack gap="xl">
          <Reveal>
            <Stack gap="xs" maw={560}>
              <Title order={2} fz={{ base: 26, sm: 32 }}>
                Vos données, protégées et bien organisées
              </Title>
            </Stack>
          </Reveal>

          <Reveal delay={80}>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {POINTS.map((point) => (
                <Stack key={point.title} gap="sm">
                  <ThemeIcon color="emerald" variant="light" radius="xl" size={40}>
                    <point.icon size={20} />
                  </ThemeIcon>
                  <Text fw={600} size="sm">
                    {point.title}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {point.description}
                  </Text>
                </Stack>
              ))}
            </SimpleGrid>
          </Reveal>
        </Stack>
      </Container>
    </Paper>
  );
}
