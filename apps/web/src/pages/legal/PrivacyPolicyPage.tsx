import { List, Text, Title } from '@mantine/core';
import { COMPANY_INFO, orFallback } from './companyInfo';
import { LegalPageLayout } from './LegalPageLayout';

export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Politique de confidentialité"
      maxWidth={820}
      seoDescription="Politique de confidentialité et protection des données du logiciel UGE."
      seoPath="/privacy"
    >
      <Text size="sm" c="dimmed">
        Dernière mise à jour : à compléter à la publication.
      </Text>

      <Text>
        Cette politique décrit les données traitées par UGE (« le Service »),
        édité par {orFallback(COMPANY_INFO.legalName)}, et la façon dont elles sont utilisées et
        protégées.
      </Text>

      <Title order={4} mt="md">
        1. Données que nous collectons
      </Title>
      <List spacing="xs" size="sm">
        <List.Item>
          <strong>Compte</strong> : email, prénom, nom, mot de passe (jamais stocké en clair — voir
          section Sécurité).
        </List.Item>
        <List.Item>
          <strong>Organisation</strong> : nom de l'entreprise, secteur d'activité, pays, devise,
          taille d'équipe.
        </List.Item>
        <List.Item>
          <strong>Données métier</strong> que vous saisissez vous-même : produits, stocks, ventes,
          achats, fournisseurs, dépenses et données financières de votre organisation.
        </List.Item>
        <List.Item>
          <strong>WhatsApp</strong> (si activé) : numéro de téléphone et contenu des messages
          échangés avec le Copilote.
        </List.Item>
        <List.Item>
          <strong>Données techniques</strong> : en cas d'erreur applicative, des informations de
          diagnostic (page concernée, message d'erreur) peuvent être enregistrées pour nous
          permettre de corriger le problème.
        </List.Item>
      </List>

      <Title order={4} mt="md">
        2. Comment nous utilisons ces données
      </Title>
      <Text size="sm">
        Vos données servent exclusivement à faire fonctionner le Service pour votre organisation :
        afficher votre tableau de bord, analyser votre activité via le Copilote IA, vous envoyer
        les emails nécessaires (réinitialisation de mot de passe, invitations d'équipe) et vous
        alerter via WhatsApp si vous avez activé cette option. Nous ne vendons ni ne louons vos
        données à des tiers, et nous ne les utilisons pas à des fins publicitaires.
      </Text>

      <Title order={4} mt="md">
        3. Avec qui vos données sont partagées
      </Title>
      <Text size="sm" mb="xs">
        Certaines fonctionnalités s'appuient sur des prestataires techniques, qui traitent
        uniquement les données nécessaires à leur fonction :
      </Text>
      <List spacing="xs" size="sm">
        <List.Item>
          <strong>Anthropic</strong> (Claude) — reçoit les questions posées au Copilote et les
          données de votre activité nécessaires pour y répondre, uniquement lorsque vous utilisez
          cette fonctionnalité.
        </List.Item>
        <List.Item>
          <strong>Resend</strong> — envoie les emails transactionnels (réinitialisation de mot de
          passe, invitations).
        </List.Item>
        <List.Item>
          <strong>Meta / WhatsApp Business Platform</strong> — achemine les messages WhatsApp, si
          vous avez activé cette intégration.
        </List.Item>
        <List.Item>
          <strong>Notre hébergeur</strong> ({orFallback(COMPANY_INFO.hostingProviderName)}) —
          stocke l'ensemble des données du Service.
        </List.Item>
      </List>

      <Title order={4} mt="md">
        4. Sécurité
      </Title>
      <List spacing="xs" size="sm">
        <List.Item>Mots de passe stockés uniquement sous forme hachée (bcrypt), jamais en clair.</List.Item>
        <List.Item>
          Authentification par jetons de session à durée de vie limitée, révocables à tout moment.
        </List.Item>
        <List.Item>
          Séparation stricte des données entre organisations — aucune entreprise n'a accès aux
          données d'une autre.
        </List.Item>
        <List.Item>Accès aux fonctionnalités limité selon le rôle de chaque utilisateur.</List.Item>
      </List>
      <Text size="sm" c="dimmed" mt="xs">
        Nous n'utilisons pas de cookies de suivi publicitaire. La connexion repose sur le stockage
        local de votre navigateur, pas sur des cookies tiers.
      </Text>

      <Title order={4} mt="md">
        5. Conservation des données
      </Title>
      <Text size="sm">
        Vos données sont conservées tant que votre compte est actif. Vous pouvez demander la
        suppression de votre compte et de vos données à tout moment en nous contactant (voir page
        Contact).
      </Text>

      <Title order={4} mt="md">
        6. Vos droits
      </Title>
      <Text size="sm">
        Vous pouvez demander l'accès, la rectification, l'export ou la suppression de vos données
        personnelles à tout moment, en nous contactant à{' '}
        {orFallback(COMPANY_INFO.contactEmail)}.
      </Text>
    </LegalPageLayout>
  );
}
