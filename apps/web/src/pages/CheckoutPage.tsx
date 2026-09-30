import { Anchor, Button, Card, Container, Group, Skeleton, Stack, Text, Title } from '@mantine/core';
import { IconShieldCheck } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { invalidateBillingAfterPayment, usePlans } from '../hooks/useBilling';
import { formatCurrency } from '../lib/format';
import { PaymentModal } from './billing/PaymentModal';

const PERIOD_LABEL: Record<string, string> = { MONTHLY: 'mois', YEARLY: 'an' };

/**
 * Page de checkout focalisée sur une seule offre (via ?plan=<code>) —
 * destination de la redirection post-inscription/connexion quand une offre
 * payante a été choisie sur la landing page (voir pendingPlan.ts et
 * ProtectedRoute.tsx). Réutilise PaymentModal tel quel, comme BillingPage et
 * SubscriptionExpiredPage — un seul composant de paiement dans toute l'app.
 */
export function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: plans = [], isLoading } = usePlans();
  const [modalOpened, setModalOpened] = useState(false);

  const planCode = searchParams.get('plan');
  const plan = plans.find((p) => p.code === planCode) ?? null;

  async function handlePaymentModalClose() {
    setModalOpened(false);
    // Attendre que l'organisation soit re-chargée AVANT de naviguer : sinon
    // ProtectedRoute lit encore accessLocked=true depuis le cache pas encore
    // rafraîchi et rebondit sur /subscription-expired malgré le paiement
    // réussi (page non protégée, ne se corrige jamais toute seule ensuite).
    await Promise.all([
      invalidateBillingAfterPayment(queryClient),
      queryClient.invalidateQueries({ queryKey: ['organization'] }),
    ]);
    navigate('/dashboard');
  }

  return (
    <Container size="xs" py={80}>
      <Stack gap="xl" align="center" ta="center">
        <Logo size="sm" />

        {isLoading ? (
          <Skeleton height={220} w="100%" />
        ) : !plan ? (
          <Stack gap="md" align="center">
            <Title order={3}>Offre introuvable</Title>
            <Text c="dimmed">Ce lien de paiement ne correspond à aucune offre active.</Text>
            <Anchor component={Link} to="/#tarifs">
              Voir les offres
            </Anchor>
          </Stack>
        ) : (
          <Card withBorder padding="xl" w="100%">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Votre abonnement
              </Text>
              <Title order={2}>{plan.name}</Title>
              <Group gap={4} align="baseline">
                <Text fw={700} fz={32}>
                  {formatCurrency(plan.price)}
                </Text>
                <Text size="sm" c="dimmed">
                  / {PERIOD_LABEL[plan.period] ?? plan.period.toLowerCase()}
                </Text>
              </Group>

              <Group gap={6} justify="center" c="dimmed">
                <IconShieldCheck size={16} />
                <Text size="sm">Paiement sécurisé avec CamPay</Text>
              </Group>

              <Button size="md" fullWidth mt="sm" onClick={() => setModalOpened(true)}>
                Payer maintenant
              </Button>

              <Anchor component={Link} to="/#tarifs" size="sm" ta="center">
                Choisir une autre offre
              </Anchor>
            </Stack>
          </Card>
        )}
      </Stack>

      <PaymentModal opened={modalOpened} plan={plan} onClose={handlePaymentModalClose} />
    </Container>
  );
}
