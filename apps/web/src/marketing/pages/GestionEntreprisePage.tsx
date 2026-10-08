import { Anchor, Container, Stack, Text, Title } from '@mantine/core';
import {
  IconBuildingWarehouse,
  IconMessageChatbot,
  IconReceipt,
  IconReportMoney,
  IconTruckLoading,
  IconUsersGroup,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Seo } from '../../components/Seo';
import '../marketing.css';
import { FeatureGrid, type FeatureItem } from '../FeatureGrid';
import { MarketingCta } from '../MarketingCta';
import { MarketingFooter } from '../MarketingFooter';
import { MarketingHeader } from '../MarketingHeader';
import { Reveal } from '../Reveal';

const MODULES: FeatureItem[] = [
  {
    icon: IconBuildingWarehouse,
    title: 'Stock',
    description: 'Produits, mouvements et alertes de rupture centralisés, avec une visibilité cohérente partout.',
  },
  {
    icon: IconReceipt,
    title: 'Ventes et achats',
    description: 'Enregistrement des ventes, commandes fournisseurs et réceptions, avec mise à jour automatique du stock.',
  },
  {
    icon: IconReportMoney,
    title: 'Finance',
    description: "Chiffre d'affaires, dépenses, marge et rentabilité par produit, calculés à partir de vos données réelles.",
  },
  {
    icon: IconUsersGroup,
    title: 'Équipe',
    description: "Invitez vos collaborateurs avec des rôles distincts (vendeur, magasinier, comptable...) selon votre offre.",
  },
  {
    icon: IconMessageChatbot,
    title: 'Copilote IA',
    description: 'Une intelligence artificielle qui lit vos données pour vous aider à comprendre votre activité et décider plus vite.',
  },
  {
    icon: IconTruckLoading,
    title: 'Fournisseurs et dépenses',
    description: 'Répertoire fournisseurs et suivi de vos charges, pour une vue complète de ce qui entre et sort de votre trésorerie.',
  },
];

export function GestionEntreprisePage() {
  return (
    <>
      <Seo
        title="UGE | Solution de gestion d'entreprise pour PME"
        description="UGE centralise stock, ventes, achats, finance et Copilote IA dans un seul espace, pour aider les PME à piloter leur entreprise au quotidien."
        path="/gestion-entreprise"
      />
      <MarketingHeader />
      <main>
        <Container size="lg" py={{ base: 48, sm: 72 }}>
          <Reveal>
            <Stack gap="md" maw={760}>
              <Title order={1} fz={{ base: 28, sm: 38 }}>
                UGE, la gestion d'entreprise réunie dans un seul espace
              </Title>
              <Text c="dimmed" size="lg">
                Plutôt que de jongler entre plusieurs outils pour suivre son stock, ses ventes, ses
                achats et ses finances, UGE réunit les modules réellement utiles à une PME dans un
                seul espace — avec un Copilote IA qui aide à comprendre ce qui se passe réellement
                dans l'entreprise.
              </Text>
            </Stack>
          </Reveal>
        </Container>

        <Container size="lg" pb={{ base: 48, sm: 72 }}>
          <FeatureGrid items={MODULES} />
        </Container>

        <Container size="lg" pb={{ base: 24, sm: 40 }}>
          <Text c="dimmed" size="sm" maw={720}>
            Pour le détail de chaque fonctionnalité, consultez la page{' '}
            <Anchor component={Link} to="/fonctionnalites">
              fonctionnalités
            </Anchor>
            , ou découvrez nos pages dédiées à la{' '}
            <Anchor component={Link} to="/gestion-stock">
              gestion de stock
            </Anchor>{' '}
            et au{' '}
            <Anchor component={Link} to="/copilote-ia">
              Copilote IA
            </Anchor>
            .
          </Text>
        </Container>

        <MarketingCta
          title="Centralisez la gestion de votre entreprise"
          description="Créez votre espace UGE et configurez vos premiers produits en quelques minutes."
        />
      </main>
      <MarketingFooter />
    </>
  );
}
