import {
  Alert,
  Anchor,
  Button,
  Center,
  Group,
  Paper,
  PasswordInput,
  PinInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconArrowLeft } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Logo } from '../components/Logo';
import { ApiError } from '../lib/apiClient';

interface LoginFormValues {
  email: string;
  password: string;
}

/** Codes d'erreur (voir AuthService#verifyLoginCode / #resendLoginCode)
 * pour lesquels la session de vérification est définitivement morte —
 * rester sur l'étape code n'a plus de sens, il faut se reconnecter. */
const DEAD_CHALLENGE_CODES = new Set(['LOGIN_CHALLENGE_INVALID', 'LOGIN_CODE_MAX_ATTEMPTS']);

export function LoginPage() {
  const { login, verifyLoginCode, resendLoginCode } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'credentials' | 'code'>('credentials');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendInSeconds, setResendInSeconds] = useState(0);

  const form = useForm<LoginFormValues>({
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Email invalide.'),
      password: (value) => (value.length >= 1 ? null : 'Mot de passe requis.'),
    },
  });

  useEffect(() => {
    if (resendInSeconds <= 0) return;
    const timer = setInterval(() => setResendInSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendInSeconds]);

  function backToCredentials(message?: string) {
    setStep('credentials');
    setChallengeToken(null);
    setCode('');
    setError(message ?? null);
  }

  async function handleCredentialsSubmit(values: LoginFormValues) {
    setError(null);
    setIsSubmitting(true);
    try {
      const challenge = await login(values.email, values.password);
      setChallengeToken(challenge.challengeToken);
      setResendInSeconds(challenge.resendAvailableInSeconds);
      setCode('');
      setStep('code');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyCode() {
    if (!challengeToken || code.length !== 6) return;
    setError(null);
    setIsVerifying(true);
    try {
      await verifyLoginCode(challengeToken, code);
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code && DEAD_CHALLENGE_CODES.has(err.code)) {
          backToCredentials(err.message);
          return;
        }
        setError(err.message);
      } else {
        setError('Vérification impossible.');
      }
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (!challengeToken || resendInSeconds > 0) return;
    setError(null);
    setIsResending(true);
    try {
      const challenge = await resendLoginCode(challengeToken);
      setResendInSeconds(challenge.resendAvailableInSeconds);
      setCode('');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code && DEAD_CHALLENGE_CODES.has(err.code)) {
          backToCredentials(err.message);
          return;
        }
        setError(err.message);
      } else {
        setError('Impossible de renvoyer le code.');
      }
    } finally {
      setIsResending(false);
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
          {step === 'credentials' ? (
            <Text c="dimmed" size="sm" ta="center">
              Connectez-vous pour piloter votre entreprise
            </Text>
          ) : (
            <Text c="dimmed" size="sm" ta="center">
              Un code de vérification a été envoyé à votre adresse email.
            </Text>
          )}
        </Stack>

        {step === 'credentials' ? (
          <form onSubmit={form.onSubmit(handleCredentialsSubmit)} aria-label="Connexion">
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
        ) : (
          <Stack gap="md" aria-label="Vérification du code">
            <Title order={4} ta="center">
              Vérifiez votre adresse e-mail
            </Title>

            <Stack gap={4} align="center">
              <PinInput
                length={6}
                type="number"
                value={code}
                onChange={setCode}
                onComplete={handleVerifyCode}
                disabled={isVerifying}
                aria-label="Code de vérification à 6 chiffres"
              />
            </Stack>

            {error && (
              <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
                {error}
              </Alert>
            )}

            <Button
              onClick={handleVerifyCode}
              loading={isVerifying}
              disabled={code.length !== 6}
              fullWidth
            >
              Vérifier le code
            </Button>

            <Group justify="center" gap={4}>
              <Text size="sm" c="dimmed">
                Vous n'avez pas reçu de code ?
              </Text>
              <Anchor
                component="button"
                type="button"
                size="sm"
                fw={600}
                onClick={handleResend}
                disabled={resendInSeconds > 0 || isResending}
              >
                {isResending
                  ? 'Envoi...'
                  : resendInSeconds > 0
                    ? `Renvoyer le code (${resendInSeconds}s)`
                    : 'Renvoyer le code'}
              </Anchor>
            </Group>

            <Anchor
              component="button"
              type="button"
              size="sm"
              c="dimmed"
              display="inline-flex"
              style={{ alignItems: 'center', gap: 4, justifyContent: 'center' }}
              onClick={() => backToCredentials()}
            >
              <IconArrowLeft size={14} /> Modifier mes identifiants
            </Anchor>
          </Stack>
        )}
      </Paper>
    </Center>
  );
}
