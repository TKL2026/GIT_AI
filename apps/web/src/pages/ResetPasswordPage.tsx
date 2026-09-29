import { Alert, Anchor, Button, Center, Group, Paper, PasswordInput, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { apiClient, ApiError } from '../lib/apiClient';

interface ResetPasswordFormValues {
  password: string;
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    initialValues: { password: '' },
    validate: {
      password: (value) => (value.length >= 8 ? null : 'Au moins 8 caractères.'),
    },
  });

  async function handleSubmit(values: ResetPasswordFormValues) {
    if (!token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', { token, password: values.password });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Center
      mih="100vh"
      p="md"
      style={{ background: 'linear-gradient(160deg, var(--mantine-color-emerald-0) 0%, #ffffff 55%)' }}
    >
      <Paper withBorder shadow="sm" radius="md" p="xl" w="100%" maw={380}>
        <Stack gap="xs" mb="lg" align="center">
          <Logo size="lg" />
          <Text c="dimmed" size="sm" ta="center">
            Réinitialiser votre mot de passe
          </Text>
        </Stack>

        {!token ? (
          <Stack gap="md">
            <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
              Ce lien de réinitialisation est invalide. Demandez-en un nouveau.
            </Alert>
            <Group justify="center">
              <Anchor component={Link} to="/forgot-password" size="sm">
                Demander un nouveau lien
              </Anchor>
            </Group>
          </Stack>
        ) : submitted ? (
          <Stack gap="md">
            <Alert color="emerald" icon={<IconCircleCheck size={16} />}>
              Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter.
            </Alert>
            <Button component={Link} to="/login" fullWidth>
              Se connecter
            </Button>
          </Stack>
        ) : (
          <form onSubmit={form.onSubmit(handleSubmit)} aria-label="Réinitialiser le mot de passe">
            <Stack gap="md">
              <PasswordInput
                label="Nouveau mot de passe"
                placeholder="Votre nouveau mot de passe"
                description="Au moins 8 caractères."
                required
                {...form.getInputProps('password')}
              />

              {error && (
                <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
                  {error}
                </Alert>
              )}

              <Button type="submit" loading={isSubmitting} fullWidth mt="sm">
                Réinitialiser le mot de passe
              </Button>

              <Group justify="center">
                <Anchor component={Link} to="/login" size="sm" c="dimmed">
                  Retour à la connexion
                </Anchor>
              </Group>
            </Stack>
          </form>
        )}
      </Paper>
    </Center>
  );
}
