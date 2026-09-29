import './marketing.css';
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
import { PricingSection } from './sections/PricingSection';
import { ProblemSection } from './sections/ProblemSection';
import { ProductProofSection } from './sections/ProductProofSection';
import { ProductSection } from './sections/ProductSection';
import { TrustedBySection } from './sections/TrustedBySection';
import { TrustSection } from './sections/TrustSection';
import { WhatsAppSection } from './sections/WhatsAppSection';
import { WhySection } from './sections/WhySection';

export function LandingPage() {
  return (
    <>
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
        <PricingSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <MarketingFooter />
    </>
  );
}
