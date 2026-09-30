import './sentry';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';

import { Button, Center, MantineProvider, Stack, Text } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { notifications, Notifications } from '@mantine/notifications';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ApiError, tokenStorage } from './lib/apiClient';
import { theme } from './theme';

// true si l'erreur a été traitée ici (redirection) — l'appelant ne doit
// alors rien faire de plus.
function handleAuthAndSubscriptionRedirects(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 401) {
    tokenStorage.clear();
    window.location.href = '/login';
    return true;
  }
  if (error instanceof ApiError && error.status === 403 && error.code === 'SUBSCRIPTION_EXPIRED') {
    window.location.href = '/subscription-expired';
    return true;
  }
  return false;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (handleAuthAndSubscriptionRedirects(error)) return;
      notifications.show({
        color: 'red',
        message: error instanceof ApiError ? error.message : 'Impossible de charger les données.',
      });
    },
  }),
  // Filet de sécurité pour le verrouillage post-essai côté mutations (ex:
  // PaymentModal/checkout) : ne fait QUE la redirection 401/403 — ne montre
  // jamais de notification générique ici, chaque mutation gère déjà sa
  // propre erreur localement (formulaire, Alert inline...).
  mutationCache: new MutationCache({
    onError: (error) => {
      handleAuthAndSubscriptionRedirects(error);
    },
  }),
});

function ErrorFallback() {
  return (
    <Center mih="100vh" p="md">
      <Stack align="center" gap="sm">
        <Text fw={600}>Une erreur inattendue est survenue.</Text>
        <Text size="sm" c="dimmed">
          L'équipe a été prévenue automatiquement.
        </Text>
        <Button onClick={() => window.location.reload()}>Rafraîchir la page</Button>
      </Stack>
    </Center>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Notifications position="top-right" />
      <ModalsProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
              <App />
            </Sentry.ErrorBoundary>
          </BrowserRouter>
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>
  </StrictMode>,
);
