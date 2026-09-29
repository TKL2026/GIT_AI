import { Alert, Anchor, Button, Center, Group, Loader, Stack, Text } from '@mantine/core';
import { IconAlertCircle, IconShieldCheck } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCompleteOnboarding, useOrganization } from '../../hooks/useOrganization';
import { ApiError } from '../../lib/apiClient';
import { OnboardingShell } from '../../onboarding/OnboardingShell';
import { INDUSTRY_OPTIONS } from '../../onboarding/constants';

const INDUSTRY_LABEL = Object.fromEntries(INDUSTRY_OPTIONS.map((o) => [o.value, o.label]));

function ReviewRow({ label, value, editTo }: { label: string; value: string; editTo: string }) {
  return (
    <Group justify="space-between" py={6}>
      <Stack gap={0}>
        <Text size="xs" c="dimmed">
          {label}
        </Text>
        <Text size="sm" fw={500}>
          {value}
        </Text>
      </Stack>
      <Anchor component={Link} to={editTo} size="sm">
        Modifier
      </Anchor>
    </Group>
  );
}

export function ReviewStepPage() {
  const { data: organization, isLoading } = useOrganization();
  const navigate = useNavigate();
  const completeOnboarding = useCompleteOnboarding();
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    try {
      await completeOnboarding.mutateAsync();
      navigate('/onboarding/welcome');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de créer votre espace.');
    }
  }

  return (
    <OnboardingShell
      currentStepKey="review"
      icon={IconShieldCheck}
      title="Votre espace est presque prêt 🎉"
      subtitle="Vérifiez vos informations avant de finaliser."
    >
      {isLoading || !organization ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : (
        <Stack gap="lg">
          <Stack gap={2}>
            <ReviewRow label="Entreprise" value={organization.name} editTo="/onboarding/company" />
            <ReviewRow label="Pays" value={organization.country ?? '—'} editTo="/onboarding/company" />
            <ReviewRow
              label="Secteur"
              value={(organization.industry && INDUSTRY_LABEL[organization.industry]) ?? organization.industry ?? '—'}
              editTo="/onboarding/company"
            />
            <ReviewRow label="Nombre d'utilisateurs" value={organization.teamSize ?? '—'} editTo="/onboarding/activity" />
          </Stack>

          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
              {error}
            </Alert>
          )}

          <Button onClick={handleCreate} loading={completeOnboarding.isPending} fullWidth>
            Créer mon espace
          </Button>
        </Stack>
      )}
    </OnboardingShell>
  );
}
