import { Anchor, Stack, Text } from '@mantine/core';
import { COMPANY_INFO } from './companyInfo';
import { LegalPageLayout } from './LegalPageLayout';

export function ContactPage() {
  return (
    <LegalPageLayout title="Contact">
      <Stack gap="xs">
        <Text c="dimmed">
          Une question, un besoin spécifique, ou envie d'une offre sur mesure ? Écrivez-nous :
        </Text>
        <Anchor href={`mailto:${COMPANY_INFO.contactEmail}`} fw={600}>
          {COMPANY_INFO.contactEmail}
        </Anchor>
      </Stack>
    </LegalPageLayout>
  );
}
