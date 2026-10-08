import { Badge, Card, Center, Group, Loader, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { PageHeader } from '../../components/PageHeader';
import { useAdminSystem } from '../hooks/useAdminSystem';

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <Badge color={ok ? 'emerald' : 'error'} variant="light" leftSection={ok ? <IconCheck size={12} /> : <IconX size={12} />}>
      {ok ? 'OK' : 'Problème'}
    </Badge>
  );
}

function IntegrationRow({ label, configured }: { label: string; configured: boolean }) {
  return (
    <Group justify="space-between">
      <Text size="sm">{label}</Text>
      <Badge color={configured ? 'emerald' : 'gray'} variant="light">
        {configured ? 'Configuré' : 'Non configuré'}
      </Badge>
    </Group>
  );
}

export function AdminSystemPage() {
  const { data, isLoading } = useAdminSystem();

  if (isLoading || !data) {
    return (
      <Center mih={300}>
        <Loader />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <PageHeader title="Système" description="Santé générale de la plateforme — jamais de secrets affichés ici" />

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Card>
          <Text size="sm" c="dimmed" mb={4}>
            API
          </Text>
          <StatusBadge ok={data.api === 'ok'} />
        </Card>
        <Card>
          <Text size="sm" c="dimmed" mb={4}>
            Base de données
          </Text>
          <StatusBadge ok={data.database === 'ok'} />
        </Card>
        <Card>
          <Text size="sm" c="dimmed" mb={4}>
            Environnement
          </Text>
          <Badge variant="light">{data.environment}</Badge>
        </Card>
      </SimpleGrid>

      <Card>
        <Text fw={600} mb="sm">
          Intégrations
        </Text>
        <Stack gap="xs">
          <IntegrationRow label="CamPay (paiements)" configured={data.integrations.campay} />
          <IntegrationRow label="Anthropic (Copilote IA)" configured={data.integrations.anthropic} />
          <IntegrationRow label="WhatsApp" configured={data.integrations.whatsapp} />
          <IntegrationRow label="Resend (emails)" configured={data.integrations.resend} />
        </Stack>
      </Card>
    </Stack>
  );
}
