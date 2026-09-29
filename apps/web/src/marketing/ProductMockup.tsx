import { Box, Center, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';

interface ProductMockupProps {
  /** Description du visuel (utilisée comme alt et comme légende du placeholder). */
  label: string;
  /** Capture d'écran réelle à afficher dans le cadre. */
  src?: string;
  aspectRatio?: number;
  minHeight?: number;
}

function WindowChrome() {
  return (
    <Group gap={6} px="sm" py={8} style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
      <Box w={8} h={8} style={{ borderRadius: '50%', background: 'var(--mantine-color-gray-3)' }} />
      <Box w={8} h={8} style={{ borderRadius: '50%', background: 'var(--mantine-color-gray-3)' }} />
      <Box w={8} h={8} style={{ borderRadius: '50%', background: 'var(--mantine-color-gray-3)' }} />
    </Group>
  );
}

/**
 * Cadre "fenêtre logicielle" premium pour présenter un visuel produit.
 * Affiche la vraie capture quand `src` est fourni ; sinon un emplacement
 * propre, prêt à recevoir le fichier final fourni par le client.
 */
export function ProductMockup({ label, src, aspectRatio = 16 / 10, minHeight }: ProductMockupProps) {
  return (
    <Stack
      gap={0}
      w="100%"
      bg="white"
      style={{
        borderRadius: 'var(--mantine-radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--mantine-color-gray-3)',
        boxShadow: 'var(--mantine-shadow-lg)',
      }}
    >
      <WindowChrome />
      {src ? (
        <img
          src={src}
          alt={label}
          loading="lazy"
          style={{
            width: '100%',
            display: 'block',
            aspectRatio: String(aspectRatio),
            minHeight,
            objectFit: 'cover',
            objectPosition: 'top',
          }}
        />
      ) : (
        <Center
          w="100%"
          style={{ aspectRatio: String(aspectRatio), minHeight, background: 'var(--mantine-color-gray-0)' }}
        >
          <Stack align="center" gap={6}>
            <ThemeIcon variant="light" color="gray" size={40} radius="xl">
              <IconPhoto size={20} />
            </ThemeIcon>
            <Text size="sm" c="dimmed" fw={500} ta="center">
              {label}
            </Text>
            <Text size="xs" c="dimmed">
              Visuel à intégrer
            </Text>
          </Stack>
        </Center>
      )}
    </Stack>
  );
}
