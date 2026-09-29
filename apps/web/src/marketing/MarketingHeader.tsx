import { Anchor, Box, Burger, Button, Container, Divider, Drawer, Group, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

const SECTION_LINKS = [
  { href: '#produit', label: 'Produit' },
  { href: '#copilote-ia', label: 'Copilote IA' },
  { href: '#tarifs', label: 'Tarifs' },
];

export function MarketingHeader() {
  const [opened, { toggle, close }] = useDisclosure(false);

  return (
    <Box
      component="header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--mantine-color-gray-2)',
      }}
    >
      <Container size="lg">
        <Group h={64} justify="space-between" wrap="nowrap">
          <Anchor component={Link} to="/" underline="never">
            <Logo size="sm" />
          </Anchor>

          <Group gap="xl" visibleFrom="sm">
            {SECTION_LINKS.map((link) => (
              <Anchor key={link.href} href={link.href} c="var(--mantine-color-text)" size="sm" fw={500} underline="never">
                {link.label}
              </Anchor>
            ))}
          </Group>

          <Group gap="sm" visibleFrom="sm" wrap="nowrap">
            <Button component={Link} to="/login" variant="subtle">
              Se connecter
            </Button>
            <Button component={Link} to="/register">
              Essayer gratuitement
            </Button>
          </Group>

          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" aria-label="Menu" />
        </Group>
      </Container>

      <Drawer opened={opened} onClose={close} position="right" size="xs" hiddenFrom="sm" title={<Logo size="sm" />}>
        <Stack gap="md">
          {SECTION_LINKS.map((link) => (
            <Anchor key={link.href} href={link.href} onClick={close} c="var(--mantine-color-text)" fw={500}>
              {link.label}
            </Anchor>
          ))}
          <Divider />
          <Button component={Link} to="/login" variant="default" onClick={close}>
            Se connecter
          </Button>
          <Button component={Link} to="/register" onClick={close}>
            Essayer gratuitement
          </Button>
        </Stack>
      </Drawer>
    </Box>
  );
}
