import type { PlanDto } from '@copilote/shared';
import { MobileMoneyOperator } from '@copilote/shared';
import {
  Alert,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useQueryClient } from '@tanstack/react-query';
import { IconAlertCircle, IconCircleCheck, IconClockHour4, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { useCheckout, useTransactionStatus, invalidateBillingAfterPayment } from '../../hooks/useBilling';
import { ApiError } from '../../lib/apiClient';
import { formatCurrency } from '../../lib/format';

interface PaymentModalProps {
  opened: boolean;
  onClose: () => void;
  plan: PlanDto | null;
}

interface PaymentFormValues {
  operator: MobileMoneyOperator | null;
  phoneNumber: string;
}

const PERIOD_LABEL: Record<string, string> = {
  MONTHLY: 'mois',
  YEARLY: 'an',
};

export function PaymentModal({ opened, onClose, plan }: PaymentModalProps) {
  const queryClient = useQueryClient();
  const checkout = useCheckout();
  const [error, setError] = useState<string | null>(null);
  const [externalReference, setExternalReference] = useState<string | null>(null);

  const { data: transaction, isError: isStatusError } = useTransactionStatus(externalReference);

  const form = useForm<PaymentFormValues>({
    initialValues: { operator: null, phoneNumber: '' },
    validate: {
      operator: (value) => (value ? null : 'Choisissez un mode de paiement.'),
      phoneNumber: (value) => (/^\+?\d[\d\s]{7,14}$/.test(value) ? null : 'Numéro invalide.'),
    },
  });

  function handleClose() {
    if (transaction?.status === 'SUCCESS') {
      invalidateBillingAfterPayment(queryClient);
    }
    setExternalReference(null);
    setError(null);
    form.reset();
    onClose();
  }

  async function handleSubmit(values: PaymentFormValues) {
    if (!plan || !values.operator) return;
    setError(null);
    try {
      const result = await checkout.mutateAsync({
        planId: plan.id,
        operator: values.operator,
        phoneNumber: values.phoneNumber,
      });
      setExternalReference(result.externalReference);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de lancer le paiement.");
    }
  }

  const status = transaction?.status;

  return (
    <Modal opened={opened} onClose={handleClose} title="Paiement de l'abonnement" centered>
      {!plan ? null : !externalReference ? (
        <form onSubmit={form.onSubmit(handleSubmit)} aria-label="Paiement">
          <Stack gap="md">
            <Stack gap={4}>
              <Text size="sm" c="dimmed">
                Plan choisi
              </Text>
              <Group justify="space-between">
                <Text fw={600}>{plan.name}</Text>
                <Text fw={700}>
                  {formatCurrency(plan.price)} / {PERIOD_LABEL[plan.period] ?? plan.period.toLowerCase()}
                </Text>
              </Group>
            </Stack>

            <Divider />

            <Text size="sm" fw={500}>
              Choisissez votre mode de paiement
            </Text>
            <Group grow>
              {(
                [
                  { value: MobileMoneyOperator.MTN, label: 'MTN Mobile Money', color: 'yellow' },
                  { value: MobileMoneyOperator.ORANGE, label: 'Orange Money', color: 'orange' },
                ] as const
              ).map((option) => (
                <UnstyledButton
                  key={option.value}
                  onClick={() => form.setFieldValue('operator', option.value)}
                  p="sm"
                  style={{
                    border: `2px solid ${
                      form.values.operator === option.value
                        ? `var(--mantine-color-${option.color}-6)`
                        : 'var(--mantine-color-gray-3)'
                    }`,
                    borderRadius: 'var(--mantine-radius-md)',
                    textAlign: 'center',
                  }}
                >
                  <Text size="sm" fw={600}>
                    {option.label}
                  </Text>
                </UnstyledButton>
              ))}
            </Group>
            {form.errors.operator && (
              <Text size="xs" c="red">
                {form.errors.operator}
              </Text>
            )}

            <TextInput
              label="Numéro Mobile Money"
              placeholder="+237 6XX XXX XXX"
              required
              {...form.getInputProps('phoneNumber')}
            />

            {error && (
              <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
                {error}
              </Alert>
            )}

            <Button type="submit" loading={checkout.isPending} fullWidth>
              Payer {formatCurrency(plan.price)}
            </Button>
          </Stack>
        </form>
      ) : (
        <Stack gap="md" align="center" py="md">
          {isStatusError && (
            <>
              <Center>
                <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
              </Center>
              <Text fw={600}>Erreur technique</Text>
              <Text size="sm" c="dimmed" ta="center">
                Impossible de vérifier le statut du paiement pour le moment.
              </Text>
              <Button variant="default" onClick={() => setExternalReference(null)} fullWidth>
                Réessayer
              </Button>
            </>
          )}

          {!isStatusError && (!status || status === 'PENDING') && (
            <>
              <Loader size="md" />
              <Text fw={500} ta="center">
                Paiement en attente de confirmation...
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                Validez la demande envoyée sur votre téléphone.
              </Text>
            </>
          )}

          {status === 'SUCCESS' && (
            <>
              <Center>
                <IconCircleCheck size={48} color="var(--mantine-color-emerald-6)" />
              </Center>
              <Text fw={600}>Paiement réussi</Text>
              <Button onClick={handleClose} fullWidth>
                Fermer
              </Button>
            </>
          )}

          {status === 'FAILED' && (
            <>
              <Center>
                <IconX size={48} color="var(--mantine-color-red-6)" />
              </Center>
              <Text fw={600}>Paiement refusé</Text>
              <Button
                variant="default"
                onClick={() => {
                  setExternalReference(null);
                }}
                fullWidth
              >
                Réessayer
              </Button>
            </>
          )}

          {status === 'EXPIRED' && (
            <>
              <Center>
                <IconClockHour4 size={48} color="var(--mantine-color-amber-6)" />
              </Center>
              <Text fw={600}>Paiement expiré</Text>
              <Button variant="default" onClick={() => setExternalReference(null)} fullWidth>
                Réessayer
              </Button>
            </>
          )}

          {status === 'CANCELLED' && (
            <>
              <Center>
                <IconX size={48} color="var(--mantine-color-gray-6)" />
              </Center>
              <Text fw={600}>Paiement annulé</Text>
              <Button variant="default" onClick={() => setExternalReference(null)} fullWidth>
                Réessayer
              </Button>
            </>
          )}
        </Stack>
      )}
    </Modal>
  );
}
