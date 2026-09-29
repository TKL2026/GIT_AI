import { Alert, Button, Center, Loader, Select, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconBuildingStore } from '@tabler/icons-react';
import type { OrganizationDto } from '@copilote/shared';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../lib/apiClient';
import { useOrganization, useUpdateOrganization } from '../../hooks/useOrganization';
import { OnboardingShell } from '../../onboarding/OnboardingShell';
import { COUNTRY_OPTIONS, DEFAULT_ORGANIZATION_NAME, INDUSTRY_OPTIONS, guessCountryFromLocale } from '../../onboarding/constants';

interface CompanyFormValues {
  name: string;
  country: string | null;
  industry: string | null;
}

function CompanyForm({ organization }: { organization: OrganizationDto }) {
  const navigate = useNavigate();
  const updateOrganization = useUpdateOrganization();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CompanyFormValues>({
    initialValues: {
      name: organization.name === DEFAULT_ORGANIZATION_NAME ? '' : organization.name,
      country: organization.country ?? guessCountryFromLocale(),
      industry: organization.industry,
    },
    validate: {
      name: (value) => (value.trim().length >= 2 ? null : "Nom de l'entreprise requis."),
      industry: (value) => (value ? null : "Secteur d'activité requis."),
    },
  });

  async function handleSubmit(values: CompanyFormValues) {
    setError(null);
    try {
      await updateOrganization.mutateAsync({
        name: values.name,
        country: values.country ?? undefined,
        industry: values.industry ?? undefined,
        onboardingStep: 'activity',
      });
      navigate('/onboarding/activity');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de sauvegarder ces informations.');
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} aria-label="Informations entreprise">
      <Stack gap="md">
        <TextInput
          label="Nom de l'entreprise"
          placeholder="Boutique Awa"
          required
          {...form.getInputProps('name')}
        />
        <Select
          label="Pays"
          placeholder="Sélectionnez votre pays"
          data={COUNTRY_OPTIONS}
          searchable
          {...form.getInputProps('country')}
        />
        <Select
          label="Secteur d'activité"
          placeholder="Sélectionnez un secteur"
          data={INDUSTRY_OPTIONS}
          required
          {...form.getInputProps('industry')}
        />

        {error && (
          <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
            {error}
          </Alert>
        )}

        <Button type="submit" loading={updateOrganization.isPending} fullWidth mt="sm">
          Continuer
        </Button>
      </Stack>
    </form>
  );
}

export function CompanyStepPage() {
  const { data: organization, isLoading } = useOrganization();

  return (
    <OnboardingShell
      currentStepKey="company"
      icon={IconBuildingStore}
      title="Parlons de votre entreprise"
      subtitle="Ces informations nous permettront de personnaliser votre espace de gestion."
    >
      {isLoading || !organization ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : (
        <CompanyForm organization={organization} />
      )}
    </OnboardingShell>
  );
}
