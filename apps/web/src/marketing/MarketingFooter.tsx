import { Anchor, Container, Divider, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

interface FooterLink {
  label: string;
  href?: string;
  to?: string;
}

const FOOTER_COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Produit',
    links: [
      { label: 'Fonctionnalités', href: '#produit' },
      { label: 'Copilote IA', href: '#copilote-ia' },
      { label: 'Gestion du stock', href: '#produit' },
      { label: 'WhatsApp', href: '#whatsapp' },
      { label: 'Tarifs', href: '#tarifs' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'À propos', to: '/about' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Ressources',
    links: [{ label: 'FAQ', href: '#faq' }],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Confidentialité', to: '/privacy' },
      { label: "Conditions d'utilisation", to: '/terms' },
      { label: 'Mentions légales', to: '/legal' },
    ],
  },
];

function FooterAnchor({ link }: { link: FooterLink }): ReactNode {
  if (link.to) {
    return (
      <Anchor component={Link} to={link.to} size="sm" c="dimmed">
        {link.label}
      </Anchor>
    );
  }
  return (
    <Anchor href={link.href} size="sm" c="dimmed">
      {link.label}
    </Anchor>
  );
}

export function MarketingFooter() {
  return (
    <Container size="lg" py="xl" component="footer">
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="xl" mb="xl">
        <Stack gap="xs">
          <Logo size="sm" />
          <Text size="sm" c="dimmed" maw={220}>
            Le copilote intelligent des PME — stock, ventes, achats, finance et IA réunis dans un
            seul espace.
          </Text>
        </Stack>

        {FOOTER_COLUMNS.map((column) => (
          <Stack key={column.title} gap="xs">
            <Text size="sm" fw={600}>
              {column.title}
            </Text>
            {column.links.map((link) => (
              <FooterAnchor key={link.label} link={link} />
            ))}
          </Stack>
        ))}
      </SimpleGrid>

      <Divider mb="md" />

      <Group justify="space-between">
        <Text size="xs" c="dimmed">
          © {new Date().getFullYear()} Copilote IA Business. Tous droits réservés.
        </Text>
      </Group>
    </Container>
  );
}
