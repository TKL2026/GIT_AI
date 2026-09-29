import { Alert, Button, Center, Loader, PasswordInput, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useAcceptInvite, useInvitePreview } from '../hooks/useInvites';
import { ApiError } from '../lib/apiClient';
import { OnboardingShell } from '../onboarding/OnboardingShell';

interface AcceptInviteFormValues {
  firstName: string;
  lastName: string;
  password: string;
}

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { applyAuthResponse } = useAuth();
  const { data: preview, isLoading, isError } = useInvitePreview(token);
  const acceptInvite = useAcceptInvite();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AcceptInviteFormValues>({
    initialValues: { firstName: '', lastName: '', password: '' },
    validate: {
      firstName: (value) => (value.trim().length > 0 ? null : 'Prénom requis.'),
      lastName: (value) => (value.trim().length > 0 ? null : 'Nom requis.'),
      password: (value) => (value.length >= 8 ? null : 'Au moins 8 caractères.'),
    },
  });

  async function handleSubmit(values: AcceptInviteFormValues) {
    if (!token) return;
    setError(null);
    try {
      const response = await acceptInvite.mutateAsync({ token, input: values });
      applyAuthResponse(response);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'accepter cette invitation.");
    }
  }

  if (isLoading) {
    return (
      <OnboardingShell title="Invitation">
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      </OnboardingShell>
    );
  }

  if (isError || !preview) {
    return (
      <OnboardingShell title="Invitation introuvable">
        <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
          Ce lien d'invitation est invalide ou a expiré. Demandez à votre propriétaire d'organisation de vous
          en envoyer un nouveau.
        </Alert>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      title={`Rejoignez ${preview.organizationName}`}
      subtitle={`Vous avez été invité·e en tant que ${preview.email}. Choisissez votre mot de passe pour activer votre compte.`}
      maxWidth={440}
    >
      <form onSubmit={form.onSubmit(handleSubmit)} aria-label="Accepter l'invitation">
        <Stack gap="md">
          <SimpleGrid cols={2}>
            <TextInput label="Prénom" placeholder="Awa" required {...form.getInputProps('firstName')} />
            <TextInput label="Nom" placeholder="Diallo" required {...form.getInputProps('lastName')} />
          </SimpleGrid>

          <PasswordInput
            label="Mot de passe"
            description="Au moins 8 caractères."
            required
            {...form.getInputProps('password')}
          />

          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
              {error}
            </Alert>
          )}

          <Button type="submit" loading={acceptInvite.isPending} fullWidth mt="sm">
            Rejoindre l'équipe
          </Button>

          <Text size="xs" c="dimmed" ta="center">
            Adresse e-mail : {preview.email}
          </Text>
        </Stack>
      </form>
    </OnboardingShell>
  );
}
