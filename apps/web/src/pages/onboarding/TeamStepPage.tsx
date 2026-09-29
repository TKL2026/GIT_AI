import { Alert, Badge, Button, Group, Select, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Role } from '@copilote/shared';
import { IconAlertCircle, IconCopy, IconPlus, IconUsersGroup } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useCreateInvite, useInvites } from '../../hooks/useInvites';
import { useUpdateOrganization } from '../../hooks/useOrganization';
import { ApiError } from '../../lib/apiClient';
import { OnboardingShell } from '../../onboarding/OnboardingShell';

const ROLE_OPTIONS = [
  { value: Role.DIRECTOR, label: 'Manager' },
  { value: Role.CASHIER, label: 'Vendeur' },
  { value: Role.STOCK_MANAGER, label: 'Magasinier' },
  { value: Role.ADMIN, label: 'Comptable' },
];

const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLE_OPTIONS.map((o) => [o.value, o.label]));

interface InviteFormValues {
  email: string;
  role: string;
}

export function TeamStepPage() {
  const navigate = useNavigate();
  const { data: invites = [] } = useInvites();
  const createInvite = useCreateInvite();
  const updateOrganization = useUpdateOrganization();

  const form = useForm<InviteFormValues>({
    initialValues: { email: '', role: Role.CASHIER },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Email invalide.'),
    },
  });

  async function handleInvite(values: InviteFormValues) {
    try {
      const invite = await createInvite.mutateAsync({ email: values.email, role: values.role as Role });
      const link = `${window.location.origin}/accept-invite/${invite.token}`;
      await navigator.clipboard.writeText(link).catch(() => undefined);
      notifications.show({
        color: 'green',
        message: `Invitation créée pour ${values.email}. Lien copié dans le presse-papiers.`,
      });
      form.setFieldValue('email', '');
    } catch (err) {
      notifications.show({
        color: 'red',
        message: err instanceof ApiError ? err.message : "Impossible de créer l'invitation.",
      });
    }
  }

  function copyLink(token: string) {
    const link = `${window.location.origin}/accept-invite/${token}`;
    navigator.clipboard.writeText(link).catch(() => undefined);
    notifications.show({ color: 'green', message: 'Lien copié dans le presse-papiers.' });
  }

  async function goToNextStep() {
    try {
      await updateOrganization.mutateAsync({ onboardingStep: 'review' });
    } catch {
      // Non bloquant : l'invitation d'équipe est facultative.
    }
    navigate('/onboarding/review');
  }

  return (
    <OnboardingShell
      currentStepKey="team"
      icon={IconUsersGroup}
      title="Invitez votre équipe"
      subtitle="Collaborez avec les personnes qui participent à la gestion de votre entreprise."
    >
      <Stack gap="lg">
        <form onSubmit={form.onSubmit(handleInvite)} aria-label="Inviter un collaborateur">
          <Group align="flex-end" gap="sm">
            <TextInput
              label="Email"
              placeholder="collegue@entreprise.com"
              style={{ flex: 1 }}
              {...form.getInputProps('email')}
            />
            <Select label="Rôle" data={ROLE_OPTIONS} w={160} {...form.getInputProps('role')} />
            <Button type="submit" leftSection={<IconPlus size={16} />} loading={createInvite.isPending}>
              Inviter
            </Button>
          </Group>
        </form>

        <Alert color="blue" variant="light" icon={<IconAlertCircle size={16} />}>
          Aucun e-mail n'est envoyé automatiquement : copiez le lien généré et partagez-le vous-même
          (WhatsApp, SMS...).
        </Alert>

        {invites.length > 0 && (
          <Stack gap="xs">
            <Text size="sm" fw={600}>
              Invitations envoyées
            </Text>
            {invites.map((invite) => (
              <Group key={invite.id} justify="space-between" py={4}>
                <Group gap="xs">
                  <Text size="sm">{invite.email}</Text>
                  <Badge size="sm" variant="light">
                    {ROLE_LABEL[invite.role] ?? invite.role}
                  </Badge>
                  {invite.acceptedAt && (
                    <Badge size="sm" color="emerald" variant="light">
                      Acceptée
                    </Badge>
                  )}
                </Group>
                {!invite.acceptedAt && (
                  <Button variant="subtle" size="xs" leftSection={<IconCopy size={14} />} onClick={() => copyLink(invite.token)}>
                    Copier le lien
                  </Button>
                )}
              </Group>
            ))}
          </Stack>
        )}

        <Button onClick={goToNextStep} loading={updateOrganization.isPending} fullWidth>
          {invites.length > 0 ? 'Continuer' : 'Passer cette étape'}
        </Button>
      </Stack>
    </OnboardingShell>
  );
}
