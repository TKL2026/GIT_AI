import { Anchor, Center, Paper, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { Seo } from '../../components/Seo';

interface LegalPageLayoutProps {
  title: string;
  children: ReactNode;
  maxWidth?: number;
  /** Description meta propre à la page (obligatoire : chaque page publique a sa propre description, pas de duplication). */
  seoDescription: string;
  /** Chemin canonique, ex: "/contact". */
  seoPath: string;
}

export function LegalPageLayout({ title, children, maxWidth = 640, seoDescription, seoPath }: LegalPageLayoutProps) {
  return (
    <>
      <Seo title={`UGE | ${title}`} description={seoDescription} path={seoPath} />
      <Center mih="100vh" p="md" style={{ alignItems: 'flex-start' }}>
        <Stack w="100%" maw={maxWidth} gap="lg" py="xl">
          <Center>
            <Logo size="md" />
          </Center>

          <Paper withBorder shadow="sm" radius="lg" p="xl">
            <Anchor component={Link} to="/" size="sm" c="dimmed" mb="md" display="inline-flex" style={{ alignItems: 'center', gap: 4 }}>
              <IconArrowLeft size={14} /> Retour à l'accueil
            </Anchor>
            <Title order={1} mb="md">
              {title}
            </Title>
            <Stack gap="sm">{children}</Stack>
          </Paper>
        </Stack>
      </Center>
    </>
  );
}
