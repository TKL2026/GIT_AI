import { Alert, Center, Loader, Paper, Stack, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Logo } from '../components/Logo';
import { ApiError } from '../lib/apiClient';

export function DemoLoginPage() {
  const { loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loginAsDemo()
      .then(() => {
        if (!cancelled) navigate('/dashboard', { replace: true });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? "Le mode démo n'est pas disponible actuellement."
            : 'Connexion démo impossible.',
        );
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Center
      mih="100vh"
      p="md"
      style={{ background: 'linear-gradient(160deg, var(--mantine-color-emerald-0) 0%, #ffffff 55%)' }}
    >
      <Paper withBorder shadow="sm" radius="md" p="xl" w="100%" maw={380}>
        <Stack gap="lg" align="center">
          <Logo size="lg" />
          {error ? (
            <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert" w="100%">
              {error}
            </Alert>
          ) : (
            <>
              <Loader size="sm" />
              <Text c="dimmed" size="sm" ta="center">
                Connexion à l'environnement de démonstration…
              </Text>
            </>
          )}
        </Stack>
      </Paper>
    </Center>
  );
}
