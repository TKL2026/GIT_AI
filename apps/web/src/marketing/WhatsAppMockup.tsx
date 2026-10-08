import { Avatar, Box, Group, Stack, Text } from '@mantine/core';
import { IconBrandWhatsapp, IconCheck, IconChecks } from '@tabler/icons-react';

interface MockMessage {
  from: 'copilot' | 'user';
  text: string;
  time: string;
}

const MESSAGES: MockMessage[] = [
  {
    from: 'copilot',
    text: 'Bonjour 👋 Voici votre rapport du jour : 34 ventes, 612 000 XAF de chiffre d\'affaires, 2 produits proches de la rupture.',
    time: '07:00',
  },
  {
    from: 'copilot',
    text: '⚠️ Alerte stock : il ne reste que 4 unités de "Riz 25kg". Vous voulez que je prépare une commande fournisseur ?',
    time: '11:20',
  },
  { from: 'user', text: 'Oui, montre-moi les ventes de la semaine.', time: '11:24' },
  {
    from: 'copilot',
    text: 'Vos ventes sont en hausse de 18 % par rapport à la semaine dernière, portées par "Huile 5L" et "Sucre 1kg".',
    time: '11:24',
  },
];

function Bubble({ message }: { message: MockMessage }) {
  const isCopilot = message.from === 'copilot';
  return (
    <Group justify={isCopilot ? 'flex-start' : 'flex-end'} wrap="nowrap">
      <Box
        px="sm"
        py={6}
        maw="80%"
        style={{
          background: isCopilot ? 'var(--mantine-color-white)' : '#d9fdd3',
          borderRadius: 10,
          borderTopLeftRadius: isCopilot ? 2 : 10,
          borderTopRightRadius: isCopilot ? 10 : 2,
          boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
        }}
      >
        <Text size="sm" c="dark" style={{ whiteSpace: 'pre-wrap' }}>
          {message.text}
        </Text>
        <Group gap={4} justify="flex-end" mt={2}>
          <Text size="10px" c="dimmed">
            {message.time}
          </Text>
          {!isCopilot && <IconChecks size={13} color="#53bdeb" />}
        </Group>
      </Box>
    </Group>
  );
}

/**
 * Maquette construite (pas une vraie capture) illustrant les messages
 * WhatsApp envoyés par le Copilote — utilisée car l'app n'a pas
 * d'interface de conversation WhatsApp propre à capturer.
 */
export function WhatsAppMockup() {
  return (
    <Stack
      gap={0}
      w="100%"
      style={{
        aspectRatio: String(9 / 16),
        minHeight: 420,
        borderRadius: 'var(--mantine-radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--mantine-color-gray-3)',
        boxShadow: 'var(--mantine-shadow-md)',
      }}
    >
      <Group gap="sm" px="sm" py="xs" style={{ background: '#075e54' }} wrap="nowrap">
        <Avatar radius="xl" size={32} color="emerald">
          <IconBrandWhatsapp size={18} />
        </Avatar>
        <div>
          <Text size="sm" fw={600} c="white">
            UGE
          </Text>
          <Text size="11px" c="#d1f4ea">
            en ligne
          </Text>
        </div>
      </Group>

      <Stack
        gap="xs"
        p="sm"
        flex={1}
        justify="flex-end"
        style={{
          background: '#e5ddd5',
          overflowY: 'auto',
        }}
      >
        {MESSAGES.map((message, index) => (
          <Bubble key={index} message={message} />
        ))}
      </Stack>

      <Group px="sm" py={6} justify="center" style={{ background: '#f0f0f0' }}>
        <IconCheck size={12} color="var(--mantine-color-gray-6)" />
        <Text size="10px" c="dimmed" ta="center">
          Exemple illustratif — messages types envoyés par le Copilote
        </Text>
      </Group>
    </Stack>
  );
}
