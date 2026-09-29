import { Box, Center, Container, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { Reveal } from '../Reveal';

const STEPS = [
  { number: '01', title: 'Créez votre espace', description: 'Inscription en quelques minutes, sans carte bancaire.' },
  { number: '02', title: 'Configurez votre entreprise', description: "Renseignez votre secteur, votre équipe et vos préférences." },
  { number: '03', title: 'Ajoutez vos produits et données', description: 'Importez votre catalogue ou ajoutez vos premiers produits.' },
  { number: '04', title: 'Pilotez votre activité', description: 'Stock, ventes, achats et finance réunis dans un seul espace.' },
  { number: '05', title: 'Laissez le Copilote IA vous accompagner', description: 'Il analyse vos données et vous propose des recommandations.' },
];

export function HowItWorksSection() {
  return (
    <Container size="lg" py={80} id="comment-ca-marche">
      <Stack gap="xl">
        <Reveal>
          <Stack gap="xs" maw={640}>
            <Title order={2} fz={{ base: 26, sm: 32 }}>
              Comment ça marche
            </Title>
            <Text c="dimmed" size="lg">
              Un parcours simple, pensé pour être opérationnel en quelques minutes.
            </Text>
          </Stack>
        </Reveal>

        <Box pos="relative">
          <Box
            pos="absolute"
            top={20}
            left="10%"
            right="10%"
            h={2}
            visibleFrom="sm"
            style={{ background: 'var(--mantine-color-gray-2)' }}
          />
          <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }} spacing="xl">
            {STEPS.map((step, index) => (
              <Reveal key={step.number} delay={index * 80}>
                <Stack align="center" ta="center" gap={8} pos="relative">
                  <Center
                    w={40}
                    h={40}
                    fw={700}
                    c="white"
                    style={{ borderRadius: '50%', background: 'var(--mantine-color-emerald-6)', zIndex: 1 }}
                  >
                    {step.number}
                  </Center>
                  <Text fw={600} size="sm">
                    {step.title}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {step.description}
                  </Text>
                </Stack>
              </Reveal>
            ))}
          </SimpleGrid>
        </Box>
      </Stack>
    </Container>
  );
}
