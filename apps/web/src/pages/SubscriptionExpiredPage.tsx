import type { PlanDto } from '@copilote/shared';
import { Button, Card, Center, Container, Group, SimpleGrid, Skeleton, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Logo } from '../components/Logo';
import { invalidateBillingAfterPayment, usePlans, useSubscription } from '../hooks/useBilling';
import { formatCurrency } from '../lib/format';
import { consumePendingPlan } from '../lib/pendingPlan';
import { PaymentModal } from './billing/PaymentModal';
import { COMPANY_INFO } from './legal/companyInfo';

const PERIOD_LABEL: Record<string, string> = { MONTHLY: 'mois', YEARLY: 'an' };

export function SubscriptionExpiredPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: plans = [], isLoading } = usePlans();
  const { data: subscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanDto | null>(null);
  const isAwaitingPayment = subscription?.status === 'AWAITING_PAYMENT';

  // Si l'utilisateur avait choisi une offre payante avant que son essai
  // n'expire, on lui rouvre directement le paiement pour cette offre plutôt
  // que de le laisser re-choisir depuis la grille.
  useEffect(() => {
    if (isLoading || plans.length === 0) return;
    const pendingCode = consumePendingPlan();
    if (!pendingCode) return;
    const match = plans.find((p) => p.code === pendingCode);
    if (match) setSelectedPlan(match);
  }, [isLoading, plans]);

  // Ferme la modale et retente l'entrée dans l'app : si le paiement vient
  // d'être confirmé, ProtectedRoute laissera passer (accessLocked=false
  // après invalidation) ; sinon il renverra simplement ici, sans rien casser.
  // Le await est essentiel : sans lui, la navigation se produit avant que le
  // cache "organization" ne soit rafraîchi, ProtectedRoute lit encore
  // accessLocked=true et rebondit ici (page non protégée, ne se corrige
  // jamais toute seule ensuite) malgré un paiement pourtant réussi.
  async function handlePaymentModalClose() {
    setSelectedPlan(null);
    await Promise.all([
      invalidateBillingAfterPayment(queryClient),
      queryClient.invalidateQueries({ queryKey: ['organization'] }),
    ]);
    navigate('/dashboard');
  }

  return (
    <Container size="sm" py={80}>
      <Stack gap="xl" align="center" ta="center">
        <Logo size="sm" />

        <ThemeIcon color="amber" variant="light" radius="xl" size={56}>
          <IconLock size={28} />
        </ThemeIcon>

        <Stack gap="xs" align="center">
          <Title order={2} fz={{ base: 24, sm: 28 }}>
            {isAwaitingPayment ? 'Finalisez votre inscription' : "Votre période d'essai est terminée"}
          </Title>
          <Text c="dimmed" size="lg" maw={480}>
            {isAwaitingPayment
              ? "Votre compte est créé mais aucun paiement n'a encore été confirmé. Choisissez votre offre et payez pour activer votre accès."
              : 'Votre espace et vos données sont conservés. Choisissez une offre pour réactiver votre accès.'}
          </Text>
        </Stack>

        <Stack gap="sm" w="100%">
          <Title order={4}>Voir les offres</Title>
          {isLoading ? (
            <Skeleton height={160} />
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {plans.map((plan) => (
                <Card key={plan.id} padding="lg">
                  <Stack gap="xs">
                    <Text fw={700}>{plan.name}</Text>
                    <Text fw={700} size="xl">
                      {formatCurrency(plan.price)}
                      <Text component="span" size="sm" c="dimmed">
                        {' '}
                        / {PERIOD_LABEL[plan.period] ?? plan.period.toLowerCase()}
                      </Text>
                    </Text>
                    <Button mt="sm" onClick={() => setSelectedPlan(plan)}>
                      Choisir {plan.name}
                    </Button>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Stack>

        <Center>
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Besoin d'aide ou d'une offre sur mesure ?
            </Text>
            <Button component="a" href={`mailto:${COMPANY_INFO.contactEmail}`} variant="subtle" size="compact-sm">
              Nous contacter
            </Button>
          </Group>
        </Center>

        <Button variant="subtle" color="gray" onClick={logout}>
          Se déconnecter
        </Button>
      </Stack>

      <PaymentModal opened={!!selectedPlan} plan={selectedPlan} onClose={handlePaymentModalClose} />
    </Container>
  );
}
