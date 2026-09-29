import {
  Alert,
  Anchor,
  Button,
  Center,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Logo } from '../components/Logo';
import { ApiError } from '../lib/apiClient';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Email invalide.'),
      password: (value) => (value.length >= 1 ? null : 'Mot de passe requis.'),
    },
  });

  async function handleSubmit(values: LoginFormValues) {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible.');
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
            Connectez-vous pour piloter votre entreprise
          </Text>
        </Stack>

        <form onSubmit={form.onSubmit(handleSubmit)} aria-label="Connexion">
          <Stack gap="md">
            <TextInput
              type="email"
              label="Email"
              placeholder="vous@entreprise.com"
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Mot de passe"
              placeholder="Votre mot de passe"
              required
              {...form.getInputProps('password')}
            />

            <Anchor component={Link} to="/forgot-password" size="sm" ta="right">
              Mot de passe oublié ?
            </Anchor>

            {error && (
              <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
                {error}
              </Alert>
            )}

            <Button type="submit" loading={isSubmitting} fullWidth mt="sm">
              Se connecter
            </Button>

            <Group justify="center">
              <Text size="sm" c="dimmed">
                Pas encore de compte ?{' '}
                <Anchor component={Link} to="/register" size="sm">
                  Créer un compte
                </Anchor>
              </Text>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}
