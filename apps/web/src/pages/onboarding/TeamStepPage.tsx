import { Button, Stack } from '@mantine/core';
import { IconUsersGroup } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { InviteTeamPanel } from '../../components/InviteTeamPanel';
import { useInvites } from '../../hooks/useInvites';
import { useUpdateOrganization } from '../../hooks/useOrganization';
import { OnboardingShell } from '../../onboarding/OnboardingShell';

export function TeamStepPage() {
  const navigate = useNavigate();
  const { data: invites = [] } = useInvites();
  const updateOrganization = useUpdateOrganization();

  async function goToNextStep() {
    try {
      await updateOrganization.mutateAsync({ onboardingStep: 'review' });
    } catch {
      // Non bloquant : l'invitation d'équipe est facultative.
    }
    navigate('/onboarding/review');
  }

  return (
    <OnboardingShell
      currentStepKey="team"
      icon={IconUsersGroup}
      title="Invitez votre équipe"
      subtitle="Collaborez avec les personnes qui participent à la gestion de votre entreprise."
    >
      <Stack gap="lg">
        <InviteTeamPanel />

        <Button onClick={goToNextStep} loading={updateOrganization.isPending} fullWidth>
          {invites.length > 0 ? 'Continuer' : 'Passer cette étape'}
        </Button>
      </Stack>
    </OnboardingShell>
  );
}
