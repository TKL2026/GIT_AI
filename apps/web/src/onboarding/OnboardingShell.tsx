import { Box, Center, Group, Paper, Stack, Text, ThemeIcon, Title, UnstyledButton } from '@mantine/core';
import { IconArrowLeft, IconCheck, type Icon } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Logo } from '../components/Logo';
import { ONBOARDING_STEPS } from './steps';

interface OnboardingShellProps {
  /** Clé de l'étape courante parmi ONBOARDING_STEPS, ou undefined pour
   * l'écran Compte (avant l'indicateur) et l'écran Bienvenue (après). */
  currentStepKey?: string;
  /** Icône thématique secondaire affichée au-dessus du titre — habillage
   * visuel uniquement, le formulaire reste l'élément prioritaire de l'écran. */
  icon?: Icon;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: ReactNode;
  maxWidth?: number;
}

function StepIndicator({ currentStepKey }: { currentStepKey: string }) {
  const currentIndex = ONBOARDING_STEPS.findIndex((s) => s.key === currentStepKey);

  return (
    <Group gap={0} wrap="nowrap" mb="xl" px="xs">
      {ONBOARDING_STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <Group key={step.key} gap={0} wrap="nowrap" style={{ flex: index === 0 ? '0 0 auto' : 1 }}>
            {index > 0 && (
              <Box
                style={{
                  flex: 1,
                  height: 2,
                  background: isDone || isCurrent ? 'var(--mantine-color-emerald-4)' : 'var(--mantine-color-gray-3)',
                }}
              />
            )}
            <Stack gap={4} align="center" style={{ flex: '0 0 auto' }}>
              <Center
                w={28}
                h={28}
                style={{
                  borderRadius: '50%',
                  border: '2px solid',
                  borderColor: isDone || isCurrent ? 'var(--mantine-color-emerald-6)' : 'var(--mantine-color-gray-3)',
                  background: isDone ? 'var(--mantine-color-emerald-6)' : 'transparent',
                  color: isDone ? 'white' : isCurrent ? 'var(--mantine-color-emerald-7)' : 'var(--mantine-color-gray-5)',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {isDone ? <IconCheck size={14} /> : index + 1}
              </Center>
              <Text size="xs" c={isCurrent ? 'emerald.7' : 'dimmed'} fw={isCurrent ? 600 : 400} visibleFrom="sm">
                {step.label}
              </Text>
            </Stack>
          </Group>
        );
      })}
    </Group>
  );
}

export function OnboardingShell({
  currentStepKey,
  icon: IconComponent,
  title,
  subtitle,
  onBack,
  children,
  maxWidth = 560,
}: OnboardingShellProps) {
  return (
    <Center
      mih="100vh"
      p="md"
      style={{ background: 'linear-gradient(160deg, var(--mantine-color-emerald-0) 0%, #ffffff 55%)' }}
    >
      <Stack w="100%" style={{ maxWidth }} gap="lg">
        <Center>
          <Logo size="md" />
        </Center>

        <Paper withBorder shadow="sm" radius="lg" p="xl">
          {currentStepKey && <StepIndicator currentStepKey={currentStepKey} />}

          {onBack && (
            <UnstyledButton onClick={onBack} mb="sm" c="dimmed" fz="sm">
              <Group gap={4}>
                <IconArrowLeft size={14} />
                <Text size="sm">Retour</Text>
              </Group>
            </UnstyledButton>
          )}

          <Stack gap={4} mb="lg">
            {IconComponent && (
              <ThemeIcon color="emerald" variant="light" radius="xl" size={40} mb={4}>
                <IconComponent size={20} />
              </ThemeIcon>
            )}
            <Title order={3}>{title}</Title>
            {subtitle && (
              <Text c="dimmed" size="sm">
                {subtitle}
              </Text>
            )}
          </Stack>

          {children}
        </Paper>
      </Stack>
    </Center>
  );
}
