import { Alert, Badge, Button, Center, PasswordInput, Paper, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { ApiError } from '../../lib/apiClient';
import { useAdminAuth } from '../AdminAuthContext';

interface AdminLoginFormValues {
  email: string;
  password: string;
}

export function AdminLoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdminLoginFormValues>({
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Email invalide.'),
      password: (value) => (value.length >= 1 ? null : 'Mot de passe requis.'),
    },
  });

  async function handleSubmit(values: AdminLoginFormValues) {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Center mih="100vh" p="md" bg="gray.1">
      <Paper withBorder shadow="sm" radius="md" p="xl" w="100%" maw={380}>
        <Stack gap="xs" mb="lg" align="center">
          <Logo size="lg" />
          <Badge color="amber" variant="light">
            Admin
          </Badge>
          <Text c="dimmed" size="sm" ta="center">
            Back-office réservé aux administrateurs de la plateforme UGE
          </Text>
        </Stack>

        <form onSubmit={form.onSubmit(handleSubmit)} aria-label="Connexion administrateur">
          <Stack gap="md">
            <TextInput
              type="email"
              label="Email"
              placeholder="admin@uge.pro"
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
