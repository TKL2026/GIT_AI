import { Anchor, Container, Stack, Text, Title } from '@mantine/core';
import {
  IconBrandWhatsapp,
  IconBuildingWarehouse,
  IconCash,
  IconChartBar,
  IconMessageChatbot,
  IconPackage,
  IconReceipt,
  IconReportMoney,
  IconTruckDelivery,
  IconTruckLoading,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Seo } from '../../components/Seo';
import '../marketing.css';
import { FeatureGrid, type FeatureItem } from '../FeatureGrid';
import { MarketingCta } from '../MarketingCta';
import { MarketingFooter } from '../MarketingFooter';
import { MarketingHeader } from '../MarketingHeader';
import { Reveal } from '../Reveal';

const FEATURES: FeatureItem[] = [
  {
    icon: IconPackage,
    title: 'Produits',
    description:
      "Catalogue centralisé avec prix d'achat, prix de vente, SKU et seuils de stock minimum/maximum par produit.",
  },
  {
    icon: IconBuildingWarehouse,
    title: 'Gestion des stocks',
    description:
      'Suivi des quantités en temps réel, mouvements (entrée, sortie, ajustement) et alertes de rupture cohérentes sur tout le logiciel.',
  },
  {
    icon: IconReceipt,
    title: 'Ventes',
    description: "Enregistrement des ventes, historique par client et par produit, moyens de paiement suivis.",
  },
  {
    icon: IconTruckLoading,
    title: 'Achats',
    description:
      'Commandes fournisseurs, réception des marchandises et mise à jour automatique du stock et des coûts.',
  },
  {
    icon: IconTruckDelivery,
    title: 'Fournisseurs',
    description: "Répertoire de vos fournisseurs et historique des commandes passées auprès de chacun.",
  },
  {
    icon: IconCash,
    title: 'Dépenses',
    description: 'Suivi de vos charges (loyer, salaires, transport...) par catégorie, pour une vue complète de vos coûts.',
  },
  {
    icon: IconReportMoney,
    title: 'Finance',
    description:
      "Chiffre d'affaires, coût des marchandises vendues, marge brute et rentabilité par produit, calculés automatiquement.",
  },
  {
    icon: IconChartBar,
    title: 'Rapports',
    description:
      "Tableau de bord avec vue d'ensemble de l'activité, performance commerciale et historique des événements récents.",
  },
  {
    icon: IconMessageChatbot,
    title: 'Copilote IA',
    description:
      'Analyse vos données réelles pour répondre à vos questions, anticiper vos ruptures et repérer les anomalies.',
  },
  {
    icon: IconBrandWhatsapp,
    title: 'WhatsApp',
    description: 'Recevez votre rapport quotidien et interrogez votre Copilote directement depuis WhatsApp.',
  },
];

export function FonctionnalitesPage() {
  return (
    <>
      <Seo
        title="UGE | Toutes les fonctionnalités de gestion d'entreprise"
        description="Produits, stock, ventes, achats, fournisseurs, dépenses, finance et Copilote IA : découvrez les fonctionnalités réelles de UGE pour piloter votre entreprise."
        path="/fonctionnalites"
      />
      <MarketingHeader />
      <main>
        <Container size="lg" py={{ base: 48, sm: 72 }}>
          <Reveal>
            <Stack gap="md" maw={760}>
              <Title order={1} fz={{ base: 28, sm: 38 }}>
                Toutes les fonctionnalités de UGE pour piloter votre entreprise
              </Title>
              <Text c="dimmed" size="lg">
                UGE réunit dans un seul espace tout ce dont une PME a besoin pour suivre son activité
                au quotidien : catalogue produits, stock, ventes, achats, finance — et un Copilote IA
                qui lit vos données réelles pour vous aider à décider plus vite.
              </Text>
            </Stack>
          </Reveal>
        </Container>

        <Container size="lg" pb={{ base: 48, sm: 72 }}>
          <FeatureGrid items={FEATURES} />
        </Container>

        <Container size="lg" pb={{ base: 24, sm: 40 }}>
          <Text c="dimmed" size="sm" maw={720}>
            Envie d'aller plus loin sur un sujet précis ? Consultez nos pages dédiées à la{' '}
            <Anchor component={Link} to="/gestion-stock">
              gestion de stock
            </Anchor>
            , à la{' '}
            <Anchor component={Link} to="/gestion-entreprise">
              gestion d'entreprise
            </Anchor>
            , au{' '}
            <Anchor component={Link} to="/copilote-ia">
              Copilote IA
            </Anchor>{' '}
            ou à l'
            <Anchor component={Link} to="/whatsapp">
              intégration WhatsApp
            </Anchor>
            .
          </Text>
        </Container>

        <MarketingCta
          title="Essayez UGE gratuitement"
          description="Configurez votre espace en quelques minutes et découvrez toutes ces fonctionnalités avec vos propres données."
        />
      </main>
      <MarketingFooter />
    </>
  );
}
