import { Alert, Anchor, Button, Center, Group, Paper, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { apiClient, ApiError } from '../lib/apiClient';

interface ForgotPasswordFormValues {
  email: string;
}

export function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    initialValues: { email: '' },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Email invalide.'),
    },
  });

  async function handleSubmit(values: ForgotPasswordFormValues) {
    setError(null);
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: values.email });
      // Toujours le même message, que le compte existe ou non — évite de
      // révéler quels emails sont enregistrés.
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
            Mot de passe oublié
          </Text>
        </Stack>

        {submitted ? (
          <Stack gap="md">
            <Alert color="emerald" icon={<IconCircleCheck size={16} />}>
              Si un compte existe avec cette adresse, un lien de réinitialisation a été envoyé.
            </Alert>
            <Group justify="center">
              <Anchor component={Link} to="/login" size="sm">
                Retour à la connexion
              </Anchor>
            </Group>
          </Stack>
        ) : (
          <form onSubmit={form.onSubmit(handleSubmit)} aria-label="Mot de passe oublié">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Indiquez votre adresse email, nous vous enverrons un lien pour réinitialiser votre
                mot de passe.
              </Text>

              <TextInput
                type="email"
                label="Email"
                placeholder="vous@entreprise.com"
                required
                {...form.getInputProps('email')}
              />

              {error && (
                <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
                  {error}
                </Alert>
              )}

              <Button type="submit" loading={isSubmitting} fullWidth mt="sm">
                Envoyer le lien
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
