import { Alert, Anchor, Button, Checkbox, Group, PasswordInput, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/apiClient';
import { consumePendingPlan, peekPendingPlan } from '../lib/pendingPlan';
import { OnboardingShell } from '../onboarding/OnboardingShell';

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormValues>({
    initialValues: { firstName: '', lastName: '', email: '', password: '', acceptTerms: false },
    validate: {
      firstName: (value) => (value.trim().length > 0 ? null : 'Prénom requis.'),
      lastName: (value) => (value.trim().length > 0 ? null : 'Nom requis.'),
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Email invalide.'),
      password: (value) => (value.length >= 8 ? null : 'Au moins 8 caractères.'),
      acceptTerms: (value) => (value ? null : "Vous devez accepter les conditions d'utilisation."),
    },
  });

  async function handleSubmit(values: RegisterFormValues) {
    setError(null);
    setIsSubmitting(true);
    // Lecture seule ici (pas de consommation) : si l'inscription échoue
    // (ex: email déjà utilisé), l'offre choisie doit rester disponible pour
    // une nouvelle tentative.
    const planCode = peekPendingPlan() ?? undefined;
    try {
      await register({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        planCode,
      });
      if (planCode) {
        // Offre payante : aucun essai, direction le paiement — l'onboarding
        // se fera une fois l'abonnement activé (voir ProtectedRoute).
        consumePendingPlan();
        navigate(`/checkout?plan=${planCode}`);
      } else {
        navigate('/onboarding/company');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Inscription impossible.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <OnboardingShell title="Créez votre compte" subtitle="Commencez à gérer votre entreprise intelligemment en quelques minutes." maxWidth={440}>
      <form onSubmit={form.onSubmit(handleSubmit)} aria-label="Créer un compte">
        <Stack gap="md">
          <SimpleGrid cols={2}>
            <TextInput
              label="Prénom"
              placeholder="Awa"
              name="given-name"
              autoComplete="given-name"
              required
              {...form.getInputProps('firstName')}
            />
            <TextInput
              label="Nom"
              placeholder="Diallo"
              name="family-name"
              autoComplete="family-name"
              required
              {...form.getInputProps('lastName')}
            />
          </SimpleGrid>

          <TextInput
            type="email"
            label="Adresse e-mail"
            name="email"
            autoComplete="email"
            placeholder="vous@entreprise.com"
            required
            {...form.getInputProps('email')}
          />

          <PasswordInput
            label="Mot de passe"
            placeholder="Votre mot de passe"
            description="Au moins 8 caractères."
            name="new-password"
            autoComplete="new-password"
            required
            {...form.getInputProps('password')}
          />

          <Checkbox
            label="J'accepte les Conditions d'utilisation et la Politique de confidentialité"
            {...form.getInputProps('acceptTerms', { type: 'checkbox' })}
          />

          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
              {error}
            </Alert>
          )}

          <Button type="submit" loading={isSubmitting} fullWidth mt="sm">
            Créer mon compte
          </Button>

          <Group justify="center">
            <Text size="sm" c="dimmed">
              Vous avez déjà un compte ?{' '}
              <Anchor component={Link} to="/login" size="sm">
                Se connecter
              </Anchor>
            </Text>
          </Group>
        </Stack>
      </form>
    </OnboardingShell>
  );
}
