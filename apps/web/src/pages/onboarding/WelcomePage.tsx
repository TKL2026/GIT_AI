import { Button, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconBoxSeam, IconReceipt2, IconTruckDelivery } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { OnboardingShell } from '../../onboarding/OnboardingShell';

const CHECKLIST = [
  { icon: IconBoxSeam, label: 'Ajouter vos produits' },
  { icon: IconTruckDelivery, label: 'Ajouter vos fournisseurs' },
  { icon: IconReceipt2, label: 'Enregistrer votre première vente' },
];

export function WelcomePage() {
  const navigate = useNavigate();

  return (
    <OnboardingShell title="Bienvenue dans Copilote IA Business" subtitle="Votre espace est prêt.">
      <Stack gap="lg">
        <Stack gap="sm">
          {CHECKLIST.map((item) => (
            <Group key={item.label} gap="sm">
              <ThemeIcon variant="light" color="emerald" radius="xl" size={32}>
                <item.icon size={16} />
              </ThemeIcon>
              <Text size="sm">{item.label}</Text>
            </Group>
          ))}
        </Stack>

        <Button onClick={() => navigate('/dashboard')} fullWidth size="md">
          Accéder à mon Dashboard
        </Button>
      </Stack>
    </OnboardingShell>
  );
}
