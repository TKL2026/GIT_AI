import { Anchor, Container, Stack, Text, Title } from '@mantine/core';
import {
  IconBriefcase,
  IconChartLine,
  IconClipboardList,
  IconReportMoney,
  IconShieldCheck,
  IconTruckDelivery,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Seo } from '../../components/Seo';
import '../marketing.css';
import { FeatureGrid, type FeatureItem } from '../FeatureGrid';
import { MarketingCta } from '../MarketingCta';
import { MarketingFooter } from '../MarketingFooter';
import { MarketingHeader } from '../MarketingHeader';
import { ProductMockup } from '../ProductMockup';
import { Reveal } from '../Reveal';

const CAPABILITIES: FeatureItem[] = [
  {
    icon: IconClipboardList,
    title: 'Analyse de votre activité',
    description:
      "Répond à vos questions en langage naturel en s'appuyant sur vos vraies données — produits, stock, ventes, achats et finances.",
  },
  {
    icon: IconChartLine,
    title: 'Prévisions de stock',
    description:
      "Estime, à partir de votre rythme de ventes, dans combien de jours un produit sera en rupture, et recommande une quantité à recommander.",
  },
  {
    icon: IconShieldCheck,
    title: "Détection d'anomalies",
    description:
      "Signale les ajustements de stock ou les ventes inhabituelles à vérifier — un repère, pas une accusation.",
  },
  {
    icon: IconReportMoney,
    title: 'Analyse financière',
    description:
      "Traduit vos chiffres en chiffre d'affaires, marge brute, rentabilité par produit et tendances mensuelles.",
  },
  {
    icon: IconBriefcase,
    title: 'Recommandations commerciales',
    description:
      'Identifie les produits rentables à mettre en avant, les opportunités de vente croisée et les clients à relancer.',
  },
  {
    icon: IconTruckDelivery,
    title: "Recommandations d'achat",
    description: 'Suggère quoi acheter, en quelle quantité, et auprès de quel fournisseur selon votre historique.',
  },
];

export function CopiloteIaPage() {
  return (
    <>
      <Seo
        title="UGE | Copilote IA pour votre entreprise"
        description="Le Copilote IA de UGE analyse vos données réelles : prévisions de stock, anomalies, finance et recommandations commerciales ou d'achat."
        path="/copilote-ia"
      />
      <MarketingHeader />
      <main>
        <Container size="lg" py={{ base: 48, sm: 72 }}>
          <Reveal>
            <Stack gap="md" maw={760}>
              <Title order={1} fz={{ base: 28, sm: 38 }}>
                Le Copilote IA, une fonctionnalité de UGE
              </Title>
              <Text c="dimmed" size="lg">
                Le Copilote IA n'est pas un chatbot générique : c'est une fonctionnalité de UGE qui
                lit vos données réelles pour vous aider à comprendre votre activité et décider plus
                vite. Il analyse — il ne décide pas à votre place.
              </Text>
            </Stack>
          </Reveal>
        </Container>

        <Container size="lg" pb={{ base: 32, sm: 48 }}>
          <Reveal>
            <ProductMockup label="Aperçu — Conversation avec le Copilote" src="/screenshots/copilot.png" aspectRatio={16 / 9} />
          </Reveal>
        </Container>

        <Container size="lg" pb={{ base: 48, sm: 72 }}>
          <FeatureGrid items={CAPABILITIES} />
        </Container>

        <Container size="lg" pb={{ base: 24, sm: 40 }}>
          <Text c="dimmed" size="sm" maw={720}>
            Le Copilote IA est aussi accessible depuis WhatsApp — voir la page{' '}
            <Anchor component={Link} to="/whatsapp">
              intégration WhatsApp
            </Anchor>
            .
          </Text>
        </Container>

        <MarketingCta
          title="Laissez le Copilote analyser votre activité"
          description="Ajoutez vos données réelles (produits, ventes, achats) et posez vos premières questions au Copilote IA de UGE."
        />
      </main>
      <MarketingFooter />
    </>
  );
}
