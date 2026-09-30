import type { PlanDto } from '@copilote/shared';
import { Button, Card, Center, Container, Group, SimpleGrid, Skeleton, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Logo } from '../components/Logo';
import { invalidateBillingAfterPayment, usePlans } from '../hooks/useBilling';
import { formatCurrency } from '../lib/format';
import { PaymentModal } from './billing/PaymentModal';
import { COMPANY_INFO } from './legal/companyInfo';

const PERIOD_LABEL: Record<string, string> = { MONTHLY: 'mois', YEARLY: 'an' };

export function SubscriptionExpiredPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: plans = [], isLoading } = usePlans();
  const [selectedPlan, setSelectedPlan] = useState<PlanDto | null>(null);

  // Ferme la modale et retente l'entrée dans l'app : si le paiement vient
  // d'être confirmé, ProtectedRoute laissera passer (accessLocked=false
  // après invalidation) ; sinon il renverra simplement ici, sans rien casser.
  function handlePaymentModalClose() {
    setSelectedPlan(null);
    invalidateBillingAfterPayment(queryClient);
    queryClient.invalidateQueries({ queryKey: ['organization'] });
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
            Votre période d'essai est terminée
          </Title>
          <Text c="dimmed" size="lg" maw={480}>
            Votre espace et vos données sont conservés. Choisissez une offre pour réactiver votre
            accès.
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
