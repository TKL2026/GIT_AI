import { Button, Stack } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from './PageHeader';

interface DetailPageLayoutProps {
  title: string;
  description?: string;
  backTo: string;
  backLabel?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function DetailPageLayout({
  title,
  description,
  backTo,
  backLabel = 'Retour',
  action,
  children,
}: DetailPageLayoutProps) {
  return (
    <>
      <Button
        component={Link}
        to={backTo}
        variant="subtle"
        color="gray"
        leftSection={<IconArrowLeft size={16} />}
        mb="sm"
        px="xs"
      >
        {backLabel}
      </Button>
      <PageHeader title={title} description={description} action={action} />
      <Stack gap="lg">{children}</Stack>
    </>
  );
}
