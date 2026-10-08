import { Container, Stack, Text, Title } from '@mantine/core';
import {
  IconAlertTriangle,
  IconArrowsExchange,
  IconBuildingWarehouse,
  IconEye,
  IconPackage,
  IconTruckDelivery,
} from '@tabler/icons-react';
import { Seo } from '../../components/Seo';
import '../marketing.css';
import { FeatureGrid, type FeatureItem } from '../FeatureGrid';
import { MarketingCta } from '../MarketingCta';
import { MarketingFooter } from '../MarketingFooter';
import { MarketingHeader } from '../MarketingHeader';
import { Reveal } from '../Reveal';

const FEATURES: FeatureItem[] = [
  {
    icon: IconBuildingWarehouse,
    title: 'Suivi des stocks en temps réel',
    description:
      "La quantité et la valeur de chaque produit sont à jour à chaque vente, achat ou ajustement — plus de feuille de calcul à mettre à jour manuellement.",
  },
  {
    icon: IconArrowsExchange,
    title: 'Mouvements de stock',
    description:
      "Chaque entrée, sortie ou ajustement est enregistré avec sa raison et l'historique complet (quantité avant/après), consultable par produit.",
  },
  {
    icon: IconAlertTriangle,
    title: 'Alertes de rupture',
    description:
      "Un produit à zéro, ou sous son seuil minimum configuré, remonte automatiquement dans les alertes — avec le même statut partout dans le logiciel (catalogue, stock, tableau de bord, Copilote).",
  },
  {
    icon: IconPackage,
    title: 'Produits et seuils',
    description:
      "Chaque produit a son prix d'achat, son prix de vente et ses seuils minimum/maximum, pour déclencher une alerte au bon moment.",
  },
  {
    icon: IconTruckDelivery,
    title: 'Réapprovisionnement',
    description:
      "Le Copilote IA s'appuie sur votre rythme de ventes pour estimer dans combien de jours un produit sera en rupture, et recommande quoi commander.",
  },
  {
    icon: IconEye,
    title: 'Visibilité globale',
    description:
      "Un tableau de bord dédié présente la valeur totale du stock, le nombre de ruptures et les produits à surveiller en priorité.",
  },
];

export function GestionStockPage() {
  return (
    <>
      <Seo
        title="UGE | Logiciel de gestion de stock pour PME"
        description="UGE est un logiciel de gestion de stock pour PME : suivi en temps réel, mouvements, alertes de rupture et réapprovisionnement, sans complexité inutile."
        path="/gestion-stock"
      />
      <MarketingHeader />
      <main>
        <Container size="lg" py={{ base: 48, sm: 72 }}>
          <Reveal>
            <Stack gap="md" maw={760}>
              <Title order={1} fz={{ base: 28, sm: 38 }}>
                Un logiciel de gestion de stock pensé pour les PME
              </Title>
              <Text c="dimmed" size="lg">
                Que vous cherchiez un logiciel de gestion de stock simple pour une boutique, ou un
                outil de gestion de stock adapté à un grossiste ou une entreprise de distribution,
                UGE centralise votre inventaire dans un seul espace — avec une visibilité cohérente,
                du produit jusqu'au tableau de bord.
              </Text>
            </Stack>
          </Reveal>
        </Container>

        <Container size="lg" pb={{ base: 48, sm: 72 }}>
          <FeatureGrid items={FEATURES} />
        </Container>

        <MarketingCta
          title="Reprenez le contrôle de votre stock"
          description="Ajoutez votre premier produit et voyez votre stock se mettre à jour en temps réel, dès votre première vente ou votre première réception."
        />
      </main>
      <MarketingFooter />
    </>
  );
}
