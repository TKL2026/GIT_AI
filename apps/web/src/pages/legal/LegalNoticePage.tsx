import { List, Text, Title } from '@mantine/core';
import { COMPANY_INFO, orFallback } from './companyInfo';
import { LegalPageLayout } from './LegalPageLayout';

export function LegalNoticePage() {
  return (
    <LegalPageLayout title="Mentions légales" maxWidth={820}>
      <Title order={4}>Éditeur du site</Title>
      <List spacing={4} size="sm">
        <List.Item>Raison sociale : {orFallback(COMPANY_INFO.legalName)}</List.Item>
        <List.Item>Forme juridique : {orFallback(COMPANY_INFO.legalForm)}</List.Item>
        <List.Item>Siège social : {orFallback(COMPANY_INFO.registeredAddress)}</List.Item>
        <List.Item>Numéro d'enregistrement : {orFallback(COMPANY_INFO.registrationNumber)}</List.Item>
        <List.Item>Contact : {orFallback(COMPANY_INFO.contactEmail)}</List.Item>
        <List.Item>
          Directeur de la publication : {orFallback(COMPANY_INFO.publicationDirector)}
        </List.Item>
      </List>

      <Title order={4} mt="md">
        Hébergement
      </Title>
      <List spacing={4} size="sm">
        <List.Item>Hébergeur : {orFallback(COMPANY_INFO.hostingProviderName)}</List.Item>
        <List.Item>Adresse : {orFallback(COMPANY_INFO.hostingProviderAddress)}</List.Item>
      </List>

      <Title order={4} mt="md">
        Propriété intellectuelle
      </Title>
      <Text size="sm">
        L'ensemble des éléments du site (textes, logo, interface) est la propriété de{' '}
        {orFallback(COMPANY_INFO.legalName)}, sauf mention contraire. Toute reproduction non
        autorisée est interdite.
      </Text>

      <Title order={4} mt="md">
        Protection des données
      </Title>
      <Text size="sm">
        Le traitement des données personnelles est détaillé dans notre{' '}
        <a href="/privacy">politique de confidentialité</a>.
      </Text>
    </LegalPageLayout>
  );
}
