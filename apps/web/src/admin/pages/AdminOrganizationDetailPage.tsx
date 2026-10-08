import { Alert, Badge, Button, Card, Center, Group, Loader, NumberInput, SimpleGrid, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconClockPlus, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DetailPageLayout } from '../../components/DetailPageLayout';
import { ApiError } from '../../lib/apiClient';
import { formatDate } from '../../lib/format';
import { SUBSCRIPTION_STATUS_COLORS, SUBSCRIPTION_STATUS_LABELS } from '../../lib/labels';
import {
  useAdminOrganization,
  useExtendTrial,
  useReactivateOrganization,
  useSuspendOrganization,
} from '../hooks/useAdminOrganizations';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={500}>
        {value}
      </Text>
    </Group>
  );
}

export function AdminOrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: org, isLoading } = useAdminOrganization(id);
  const suspend = useSuspendOrganization(id ?? '');
  const reactivate = useReactivateOrganization(id ?? '');
  const extendTrial = useExtendTrial(id ?? '');
  const [extendDays, setExtendDays] = useState<number | ''>(7);

  function handleSuspend() {
    if (!org) return;
    modals.openConfirmModal({
      title: 'Suspendre cette organisation ?',
      children: (
        <Text size="sm">
          <strong>{org.name}</strong> perdra immédiatement l'accès à UGE (API et application),
          quel que soit son abonnement actuel. Cette action est journalisée et réversible à tout
          moment via "Réactiver".
        </Text>
      ),
      labels: { confirm: 'Suspendre', cancel: 'Annuler' },
      confirmProps: { color: 'error' },
      onConfirm: async () => {
        try {
          await suspend.mutateAsync();
          notifications.show({ color: 'green', message: 'Organisation suspendue.' });
        } catch (err) {
          notifications.show({
            color: 'red',
            message: err instanceof ApiError ? err.message : 'Impossible de suspendre cette organisation.',
          });
        }
      },
    });
  }

  function handleReactivate() {
    if (!org) return;
    modals.openConfirmModal({
      title: 'Réactiver cette organisation ?',
      children: (
        <Text size="sm">
          <strong>{org.name}</strong> retrouvera immédiatement l'accès à UGE.
        </Text>
      ),
      labels: { confirm: 'Réactiver', cancel: 'Annuler' },
      onConfirm: async () => {
        try {
          await reactivate.mutateAsync();
          notifications.show({ color: 'green', message: 'Organisation réactivée.' });
        } catch (err) {
          notifications.show({
            color: 'red',
            message: err instanceof ApiError ? err.message : 'Impossible de réactiver cette organisation.',
          });
        }
      },
    });
  }

  function handleExtendTrial() {
    if (!org || !extendDays) return;
    const days = extendDays;
    modals.openConfirmModal({
      title: "Prolonger l'essai gratuit ?",
      children: (
        <Text size="sm">
          L'essai de <strong>{org.name}</strong> sera prolongé de {days} jour{days > 1 ? 's' : ''}.
        </Text>
      ),
      labels: { confirm: 'Prolonger', cancel: 'Annuler' },
      onConfirm: async () => {
        try {
          await extendTrial.mutateAsync(days);
          notifications.show({ color: 'green', message: 'Essai prolongé.' });
        } catch (err) {
          notifications.show({
            color: 'red',
            message: err instanceof ApiError ? err.message : "Impossible de prolonger l'essai.",
          });
        }
      },
    });
  }

  if (isLoading || !org) {
    return (
      <Center mih={300}>
        <Loader />
      </Center>
    );
  }

  const canExtendTrial = org.subscriptionStatus === 'TRIAL' || org.subscriptionStatus === 'TRIAL_EXPIRED';

  return (
    <DetailPageLayout title={org.name} backTo="/admin/organizations" backLabel="Retour aux organisations">
      {org.suspended && (
        <Alert color="error" icon={<IconAlertTriangle size={16} />}>
          Cette organisation est actuellement suspendue — ses utilisateurs n'ont plus accès à UGE.
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Card>
          <Text fw={600} mb="sm">
            Entreprise
          </Text>
          <InfoRow label="Pays" value={org.country ?? '—'} />
          <InfoRow label="Secteur" value={org.industry ?? '—'} />
          <InfoRow label="Taille d'équipe" value={org.teamSize ?? '—'} />
          <InfoRow label="Créée le" value={formatDate(org.createdAt)} />
          <InfoRow label="Onboarding" value={org.onboardingCompletedAt ? 'Terminé' : `En cours (${org.onboardingStep ?? '—'})`} />
        </Card>

        <Card>
          <Text fw={600} mb="sm">
            Abonnement
          </Text>
          <InfoRow label="Plan" value={org.planName ?? '—'} />
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Statut
            </Text>
            {org.subscriptionStatus ? (
              <Badge color={SUBSCRIPTION_STATUS_COLORS[org.subscriptionStatus]} variant="light">
                {SUBSCRIPTION_STATUS_LABELS[org.subscriptionStatus]}
              </Badge>
            ) : (
              <Text size="sm">—</Text>
            )}
          </Group>
          <InfoRow
            label="Fin de période"
            value={org.currentPeriodEnd ? formatDate(org.currentPeriodEnd) : '—'}
          />
        </Card>

        <Card>
          <Text fw={600} mb="sm">
            Activité
          </Text>
          <InfoRow label="Utilisateurs" value={String(org.userCount)} />
          <InfoRow label="Produits" value={String(org.productCount)} />
          <InfoRow label="Ventes" value={String(org.salesCount)} />
          <InfoRow label="Dernière vente" value={org.lastSaleAt ? formatDate(org.lastSaleAt) : 'Aucune'} />
          <Button
            component={Link}
            to={`/admin/users?organizationId=${org.id}`}
            variant="subtle"
            size="compact-sm"
            mt="sm"
          >
            Voir les utilisateurs
          </Button>
        </Card>

        <Card>
          <Text fw={600} mb="sm">
            Actions
          </Text>
          <Group mb="sm">
            {org.suspended ? (
              <Button
                leftSection={<IconPlayerPlay size={16} />}
                color="emerald"
                onClick={handleReactivate}
                loading={reactivate.isPending}
              >
                Réactiver
              </Button>
            ) : (
              <Button
                leftSection={<IconPlayerPause size={16} />}
                color="error"
                variant="outline"
                onClick={handleSuspend}
                loading={suspend.isPending}
              >
                Suspendre
              </Button>
            )}
          </Group>

          {canExtendTrial && (
            <Group align="flex-end">
              <NumberInput
                label="Prolonger l'essai de"
                description="jours"
                min={1}
                max={30}
                value={extendDays}
                onChange={(value) => setExtendDays(value === '' ? '' : Number(value))}
                w={120}
              />
              <Button
                leftSection={<IconClockPlus size={16} />}
                variant="light"
                onClick={handleExtendTrial}
                loading={extendTrial.isPending}
                disabled={!extendDays}
              >
                Prolonger
              </Button>
            </Group>
          )}
        </Card>
      </SimpleGrid>
    </DetailPageLayout>
  );
}
