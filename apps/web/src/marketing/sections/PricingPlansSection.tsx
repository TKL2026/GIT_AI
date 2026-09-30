import { Badge, Button, Card, Container, Group, List, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { COMPANY_INFO } from '../../pages/legal/companyInfo';
import { Reveal } from '../Reveal';

interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  buttonLabel: string;
  buttonTo?: string;
  buttonHref?: string;
  highlight?: boolean;
  badge?: string;
}

const PLANS: PricingPlan[] = [
  {
    name: 'Essai gratuit',
    price: '0 FCFA',
    period: '48 heures',
    description: 'Découvrez UGE gratuitement pendant 48 heures, sans engagement.',
    features: [
      'Accès à UGE pendant 48 h',
      'Découverte des fonctionnalités principales',
      'Gestion de l’entreprise et des produits',
      'Découverte du Copilote IA',
      'Aucun engagement',
    ],
    buttonLabel: 'Commencer gratuitement',
    buttonTo: '/register',
  },
  {
    name: 'Standard',
    price: '5 000 FCFA',
    period: 'mois',
    description: 'Pour les petites entreprises qui veulent commencer à structurer leur gestion.',
    features: [
      'Gestion des produits',
      'Gestion des stocks',
      'Gestion des ventes',
      'Gestion des achats',
      'Gestion des fournisseurs',
      'Suivi des dépenses',
      'Tableau de bord',
      'Rapports et indicateurs essentiels',
      'Accès au Copilote IA (fonctionnalités de base)',
    ],
    buttonLabel: 'Choisir Standard',
    buttonTo: '/register',
  },
  {
    name: 'Pro',
    price: '10 000 FCFA',
    period: 'mois',
    description: 'Pour les entreprises qui ont des besoins de gestion plus avancés.',
    features: [
      'Tout le contenu de l’offre Standard',
      'Fonctionnalités avancées du Copilote IA',
      'Prévisions de réapprovisionnement',
      'Détection d’anomalies',
      'Analyse financière détaillée',
      'Recommandations commerciales',
      'Recommandations d’achat',
      'Rapports plus détaillés',
      'Notifications et rapports WhatsApp',
    ],
    buttonLabel: 'Choisir Pro',
    buttonTo: '/register',
    highlight: true,
    badge: 'Pour les entreprises en croissance',
  },
  {
    name: 'Sur mesure',
    price: 'À partir de 25 000 FCFA',
    period: 'mois',
    description: 'Une solution adaptée aux besoins spécifiques de votre entreprise.',
    features: [
      'Tout le contenu de l’offre Pro',
      'Paramétrage adapté à l’entreprise',
      'Accompagnement personnalisé',
      'Besoins spécifiques de gestion',
      'Configuration et intégrations spécifiques lorsqu’elles sont disponibles',
      'Accompagnement renforcé',
    ],
    buttonLabel: 'Parler à l’équipe',
    buttonHref: `mailto:${COMPANY_INFO.contactEmail}`,
  },
];

export function PricingPlansSection() {
  return (
    <Container size="lg" py={40} id="tarifs">
      <Reveal>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          {PLANS.map((plan) => (
            <Card key={plan.name} padding="xl" style={plan.highlight ? { borderColor: 'var(--mantine-color-emerald-5)' } : undefined}>
              <Stack gap="sm" h="100%">
                <Stack gap={4}>
                  {plan.badge && (
                    <Badge color="emerald" variant="light" w="fit-content">
                      {plan.badge}
                    </Badge>
                  )}
                  <Text fw={700} size="lg">
                    {plan.name}
                  </Text>
                  <Group gap={4} align="baseline">
                    <Text fw={700} fz={{ base: 22, sm: 26 }}>
                      {plan.price}
                    </Text>
                    {plan.period && (
                      <Text size="sm" c="dimmed">
                        / {plan.period}
                      </Text>
                    )}
                  </Group>
                  <Text size="sm" c="dimmed">
                    {plan.description}
                  </Text>
                </Stack>

                <List spacing="xs" size="sm" flex={1}>
                  {plan.features.map((feature) => (
                    <List.Item
                      key={feature}
                      icon={
                        <ThemeIcon color="emerald" variant="light" size={20} radius="xl">
                          <IconCheck size={12} />
                        </ThemeIcon>
                      }
                    >
                      {feature}
                    </List.Item>
                  ))}
                </List>

                {plan.buttonTo ? (
                  <Button
                    component={Link}
                    to={plan.buttonTo}
                    variant={plan.highlight ? 'filled' : 'default'}
                    fullWidth
                    mt="sm"
                  >
                    {plan.buttonLabel}
                  </Button>
                ) : (
                  <Button component="a" href={plan.buttonHref} variant="default" fullWidth mt="sm">
                    {plan.buttonLabel}
                  </Button>
                )}
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Reveal>
    </Container>
  );
}
