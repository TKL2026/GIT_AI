import { List, Text, Title } from '@mantine/core';
import { COMPANY_INFO, orFallback } from './companyInfo';
import { LegalPageLayout } from './LegalPageLayout';

export function TermsPage() {
  return (
    <LegalPageLayout
      title="Conditions d'utilisation"
      maxWidth={820}
      seoDescription="Conditions d'utilisation du logiciel de gestion d'entreprise UGE."
      seoPath="/terms"
    >
      <Text size="sm" c="dimmed">
        Dernière mise à jour : à compléter à la publication.
      </Text>

      <Title order={4} mt="md">
        1. Objet
      </Title>
      <Text size="sm">
        UGE est un logiciel de gestion d'entreprise (stock, ventes, achats,
        finance) enrichi d'un Copilote IA, édité par {orFallback(COMPANY_INFO.legalName)}
        . Les présentes conditions régissent l'accès et l'utilisation du service par toute
        organisation ou utilisateur créant un compte.
      </Text>

      <Title order={4} mt="md">
        2. Création de compte
      </Title>
      <Text size="sm">
        La création d'un compte implique l'acceptation des présentes conditions. Vous êtes
        responsable de l'exactitude des informations fournies et de la confidentialité de votre
        mot de passe. Toute activité effectuée depuis votre compte est présumée effectuée par vous
        ou une personne que vous avez autorisée.
      </Text>

      <Title order={4} mt="md">
        3. Utilisation du service
      </Title>
      <List spacing="xs" size="sm">
        <List.Item>Le service doit être utilisé conformément à la loi applicable.</List.Item>
        <List.Item>
          Toute tentative d'accès non autorisé aux données d'une autre organisation est interdite.
        </List.Item>
        <List.Item>
          Toute utilisation abusive (surcharge délibérée du service, extraction automatisée non
          autorisée des données) peut entraîner la suspension du compte.
        </List.Item>
      </List>

      <Title order={4} mt="md">
        4. Tarification
      </Title>
      <Text size="sm">
        Le service est actuellement proposé gratuitement pendant sa phase de lancement. Une
        tarification pourra être introduite ultérieurement ; les utilisateurs existants en seront
        informés avec un préavis raisonnable avant toute mise en place de facturation.
      </Text>

      <Title order={4} mt="md">
        5. Propriété des données
      </Title>
      <Text size="sm">
        Les données que vous saisissez (produits, ventes, achats, finances...) vous appartiennent.
        Nous ne les utilisons que pour vous fournir le service, comme décrit dans notre{' '}
        <a href="/privacy">politique de confidentialité</a>. Le logiciel, sa marque et son code
        restent la propriété de {orFallback(COMPANY_INFO.legalName)}.
      </Text>

      <Title order={4} mt="md">
        6. Disponibilité du service
      </Title>
      <Text size="sm">
        Nous mettons tout en œuvre pour assurer un service disponible et fiable, sans pouvoir
        garantir une disponibilité continue et sans interruption (maintenance, incidents
        techniques).
      </Text>

      <Title order={4} mt="md">
        7. Résiliation
      </Title>
      <Text size="sm">
        Vous pouvez cesser d'utiliser le service et demander la suppression de votre compte à tout
        moment. Nous nous réservons le droit de suspendre un compte en cas de violation manifeste
        des présentes conditions.
      </Text>

      <Title order={4} mt="md">
        8. Droit applicable
      </Title>
      <Text size="sm">
        Les présentes conditions sont régies par le droit applicable au lieu d'immatriculation de{' '}
        {orFallback(COMPANY_INFO.legalName)} — précision à compléter à la publication.
      </Text>
    </LegalPageLayout>
  );
}
