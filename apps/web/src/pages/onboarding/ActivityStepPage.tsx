import { Alert, Button, Card, Center, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import {
  IconAlertCircle,
  IconBoxSeam,
  IconCash,
  IconChartBar,
  IconLayoutGrid,
  IconReceipt,
  IconTruckDelivery,
  type Icon,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization, useUpdateOrganization } from '../../hooks/useOrganization';
import { ApiError } from '../../lib/apiClient';
import { OnboardingShell } from '../../onboarding/OnboardingShell';
import { MODULE_OPTIONS, TEAM_SIZE_OPTIONS } from '../../onboarding/constants';

const MODULE_ICONS: Record<string, Icon> = {
  stock: IconBoxSeam,
  sales: IconReceipt,
  purchases: IconTruckDelivery,
  finance: IconCash,
};

const ALL_MODULE_VALUES = MODULE_OPTIONS.map((m) => m.value);

function SelectableCard({
  icon: IconComponent,
  label,
  selected,
  onClick,
}: {
  icon: Icon;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      component="button"
      type="button"
      onClick={onClick}
      padding="md"
      withBorder
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        borderColor: selected ? 'var(--mantine-color-emerald-6)' : undefined,
        borderWidth: selected ? 2 : 1,
        background: selected ? 'var(--mantine-color-emerald-0)' : undefined,
      }}
    >
      <Stack gap={6} align="center">
        <IconComponent size={22} color={selected ? 'var(--mantine-color-emerald-7)' : undefined} />
        <Text size="sm" fw={selected ? 600 : 500} ta="center">
          {label}
        </Text>
      </Stack>
    </Card>
  );
}

export function ActivityStepPage() {
  const { data: organization, isLoading } = useOrganization();
  const navigate = useNavigate();
  const updateOrganization = useUpdateOrganization();
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState<string[] | null>(null);
  const [teamSize, setTeamSize] = useState<string | null>(null);

  const selectedModules = modules ?? organization?.modules ?? [];
  const selectedTeamSize = teamSize ?? organization?.teamSize ?? null;
  const allSelected = ALL_MODULE_VALUES.every((m) => selectedModules.includes(m));

  function toggleModule(value: string) {
    const next = selectedModules.includes(value)
      ? selectedModules.filter((m) => m !== value)
      : [...selectedModules, value];
    setModules(next);
  }

  function toggleAll() {
    setModules(allSelected ? [] : ALL_MODULE_VALUES);
  }

  async function handleSubmit() {
    setError(null);
    try {
      await updateOrganization.mutateAsync({
        modules: selectedModules,
        teamSize: selectedTeamSize ?? undefined,
        onboardingStep: 'products',
      });
      navigate('/onboarding/products');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de sauvegarder ces informations.');
    }
  }

  return (
    <OnboardingShell
      currentStepKey="activity"
      icon={IconChartBar}
      title="Que souhaitez-vous gérer ?"
      subtitle="Choisissez ce qui compte pour votre activité — vous pourrez toujours changer plus tard."
    >
      {isLoading ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : (
        <Stack gap="xl">
          <SimpleGrid cols={{ base: 2, sm: 3 }}>
            {MODULE_OPTIONS.map((option) => (
              <SelectableCard
                key={option.value}
                icon={MODULE_ICONS[option.value]}
                label={option.label}
                selected={selectedModules.includes(option.value)}
                onClick={() => toggleModule(option.value)}
              />
            ))}
            <SelectableCard icon={IconLayoutGrid} label="Tout gérer" selected={allSelected} onClick={toggleAll} />
          </SimpleGrid>

          <div>
            <Title order={5} mb="sm">
              Combien de personnes utiliseront Copilote ?
            </Title>
            <SimpleGrid cols={4}>
              {TEAM_SIZE_OPTIONS.map((option) => (
                <Card
                  key={option.value}
                  component="button"
                  type="button"
                  onClick={() => setTeamSize(option.value)}
                  padding="sm"
                  withBorder
                  style={{
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderColor: selectedTeamSize === option.value ? 'var(--mantine-color-emerald-6)' : undefined,
                    borderWidth: selectedTeamSize === option.value ? 2 : 1,
                    background: selectedTeamSize === option.value ? 'var(--mantine-color-emerald-0)' : undefined,
                  }}
                >
                  <Text size="sm" fw={selectedTeamSize === option.value ? 600 : 500}>
                    {option.label}
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          </div>

          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">
              {error}
            </Alert>
          )}

          <Button onClick={handleSubmit} loading={updateOrganization.isPending} fullWidth>
            Continuer
          </Button>
        </Stack>
      )}
    </OnboardingShell>
  );
}
