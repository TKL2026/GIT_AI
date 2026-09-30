import { Anchor, Box, Burger, Button, Container, Divider, Drawer, Group, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

interface SectionLink {
  label: string;
  href?: string;
  to?: string;
}

const SECTION_LINKS: SectionLink[] = [
  { href: '#produit', label: 'Produit' },
  { href: '#copilote-ia', label: 'Copilote IA' },
  { to: '/tarifs', label: 'Tarifs' },
];

function SectionAnchor({ link, onClick, ...props }: { link: SectionLink; onClick?: () => void } & Record<string, unknown>): ReactNode {
  if (link.to) {
    return (
      <Anchor component={Link} to={link.to} onClick={onClick} {...props}>
        {link.label}
      </Anchor>
    );
  }
  return (
    <Anchor href={link.href} onClick={onClick} {...props}>
      {link.label}
    </Anchor>
  );
}

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
              <SectionAnchor
                key={link.label}
                link={link}
                c="var(--mantine-color-text)"
                size="sm"
                fw={500}
                underline="never"
              />
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
            <SectionAnchor key={link.label} link={link} onClick={close} c="var(--mantine-color-text)" fw={500} />
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
