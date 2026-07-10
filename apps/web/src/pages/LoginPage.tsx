import {
  Alert,
  Button,
  Center,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
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
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Center mih="100vh" bg="gray.0">
      <Paper withBorder shadow="sm" radius="md" p="xl" w={380}>
        <Stack gap="xs" mb="lg">
          <Title order={2} ta="center">
            Copilote IA Business
          </Title>
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

            {error && (
              <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
                {error}
              </Alert>
            )}

            <Button type="submit" loading={isSubmitting} fullWidth mt="sm">
              Se connecter
            </Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}
