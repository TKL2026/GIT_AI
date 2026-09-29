import { Anchor, Center, Paper, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/Logo';

interface LegalPageLayoutProps {
  title: string;
  children: ReactNode;
  maxWidth?: number;
}

export function LegalPageLayout({ title, children, maxWidth = 640 }: LegalPageLayoutProps) {
  return (
    <Center mih="100vh" p="md" style={{ alignItems: 'flex-start' }}>
      <Stack w="100%" maw={maxWidth} gap="lg" py="xl">
        <Center>
          <Logo size="md" />
        </Center>

        <Paper withBorder shadow="sm" radius="lg" p="xl">
          <Anchor component={Link} to="/" size="sm" c="dimmed" mb="md" display="inline-flex" style={{ alignItems: 'center', gap: 4 }}>
            <IconArrowLeft size={14} /> Retour à l'accueil
          </Anchor>
          <Title order={2} mb="md">
            {title}
          </Title>
          <Stack gap="sm">{children}</Stack>
        </Paper>
      </Stack>
    </Center>
  );
}
