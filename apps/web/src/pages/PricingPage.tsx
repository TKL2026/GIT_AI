import '../marketing/marketing.css';
import { MarketingFooter } from '../marketing/MarketingFooter';
import { MarketingHeader } from '../marketing/MarketingHeader';
import { FinalCtaSection } from '../marketing/sections/FinalCtaSection';
import { PricingFaqSection } from '../marketing/sections/PricingFaqSection';
import { PricingIntroSection } from '../marketing/sections/PricingIntroSection';
import { PricingPhilosophySection } from '../marketing/sections/PricingPhilosophySection';
import { PricingPlansSection } from '../marketing/sections/PricingPlansSection';
import { PricingSignupHelpSection } from '../marketing/sections/PricingSignupHelpSection';

export function PricingPage() {
  return (
    <>
      <MarketingHeader />
      <main>
        <PricingIntroSection />
        <PricingPlansSection />
        <PricingSignupHelpSection />
        <PricingPhilosophySection />
        <PricingFaqSection />
        <FinalCtaSection />
      </main>
      <MarketingFooter />
    </>
  );
}
