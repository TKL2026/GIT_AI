import './marketing.css';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { MarketingFooter } from './MarketingFooter';
import { MarketingHeader } from './MarketingHeader';
import { AudienceSection } from './sections/AudienceSection';
import { CopilotAiSection } from './sections/CopilotAiSection';
import { DifferentiationSection } from './sections/DifferentiationSection';
import { FaqSection } from './sections/FaqSection';
import { FinalCtaSection } from './sections/FinalCtaSection';
import { HeroSection } from './sections/HeroSection';
import { HowItWorksSection } from './sections/HowItWorksSection';
import { IntegrationsSection } from './sections/IntegrationsSection';
import { PricingIntroSection } from './sections/PricingIntroSection';
import { PricingPhilosophySection } from './sections/PricingPhilosophySection';
import { PricingPlansSection } from './sections/PricingPlansSection';
import { PricingSignupHelpSection } from './sections/PricingSignupHelpSection';
import { ProblemSection } from './sections/ProblemSection';
import { ProductProofSection } from './sections/ProductProofSection';
import { ProductSection } from './sections/ProductSection';
import { TrustedBySection } from './sections/TrustedBySection';
import { TrustSection } from './sections/TrustSection';
import { WhatsAppSection } from './sections/WhatsAppSection';
import { WhySection } from './sections/WhySection';

export function LandingPage() {
  const location = useLocation();

  // La navigation SPA (react-router) ne fait pas défiler automatiquement
  // vers une ancre lors d'un changement de route (contrairement à une
  // navigation navigateur classique) — nécessaire pour que "Tarifs" depuis
  // le header/footer (Link to="/#tarifs") fonctionne aussi depuis une autre
  // page, pas seulement quand on est déjà sur "/".
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  return (
    <>
      <Seo
        title="UGE — Votre entreprise travaille. Votre Copilote IA analyse."
        description="Stock, ventes, achats, finance et intelligence artificielle réunis dans un seul espace. UGE aide les PME à comprendre leur activité et à décider plus vite."
        path="/"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'UGE',
            url: 'https://myuge.pro',
            logo: 'https://myuge.pro/favicon.svg',
            description:
              "UGE réunit stock, ventes, achats et finance dans un seul espace, avec un Copilote IA qui aide les PME à comprendre leur activité.",
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'UGE',
            url: 'https://myuge.pro',
          },
        ]}
      />
      <MarketingHeader />
      <main>
        <HeroSection />
        <ProductSection />
        <WhySection />
        <ProblemSection />
        <CopilotAiSection />
        <WhatsAppSection />
        <IntegrationsSection />
        <HowItWorksSection />
        <AudienceSection />
        <DifferentiationSection />
        <ProductProofSection />
        <TrustSection />
        <TrustedBySection />
        <PricingIntroSection />
        <PricingPlansSection />
        <PricingSignupHelpSection />
        <PricingPhilosophySection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <MarketingFooter />
    </>
  );
}
