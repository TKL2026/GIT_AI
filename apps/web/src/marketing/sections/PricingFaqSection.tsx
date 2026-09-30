import { Accordion, Container, Stack, Text, Title } from '@mantine/core';
import { Reveal } from '../Reveal';

const PRICING_FAQS = [
  {
    question: "Comment fonctionne l'essai gratuit de 48 heures ?",
    answer:
      "Dès la création de votre compte, vous accédez immédiatement à UGE pendant 48 heures, sans carte bancaire et sans engagement. Vous pouvez utiliser les fonctionnalités principales pour évaluer si UGE correspond à votre activité.",
  },
  {
    question: 'Dois-je payer pour commencer ?',
    answer: "Non. La création de compte et les 48 premières heures sont entièrement gratuites.",
  },
  {
    question: "Puis-je changer d'offre plus tard ?",
    answer:
      "Oui, vous pourrez passer d'une offre à l'autre selon l'évolution de vos besoins.",
  },
  {
    question: 'Que se passe-t-il à la fin de mon essai ?',
    answer:
      "Votre espace et toutes vos données sont conservés intégralement. L'accès à l'application est simplement suspendu jusqu'à ce que vous choisissiez une offre — vous ne perdez rien de ce que vous avez déjà configuré.",
  },
  {
    question: 'Les prix sont-ils mensuels ?',
    answer: "Oui, les offres Standard et Pro sont facturées chaque mois. L'offre Sur mesure dépend des besoins définis avec vous.",
  },
  {
    question: 'Puis-je demander une offre adaptée à mon entreprise ?',
    answer:
      "Oui, contactez notre équipe pour discuter de vos besoins spécifiques et obtenir une offre Sur mesure.",
  },
  {
    question: 'Êtes-vous disponibles pour m\'aider à configurer mon espace ?',
    answer:
      "Oui, nous vous accompagnons lors de la mise en place de votre espace UGE. Cet accompagnement se fait par email pour le moment.",
  },
  {
    question: 'Quels moyens de paiement acceptez-vous ?',
    answer:
      "Le paiement par Mobile Money (MTN Mobile Money et Orange Money) est en cours de mise en place. Pour l'offre Sur mesure, contactez notre équipe pour convenir des modalités.",
  },
];

export function PricingFaqSection() {
  return (
    <Container size="md" py={80} id="faq-tarifs">
      <Stack gap="xl">
        <Reveal>
          <Stack gap="xs" ta="center" align="center">
            <Title order={2} fz={{ base: 26, sm: 32 }}>
              Questions sur nos tarifs
            </Title>
          </Stack>
        </Reveal>

        <Reveal delay={80}>
          <Accordion variant="separated" radius="lg">
            {PRICING_FAQS.map((faq) => (
              <Accordion.Item key={faq.question} value={faq.question}>
                <Accordion.Control>
                  <Text fw={600} size="sm">
                    {faq.question}
                  </Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Text size="sm" c="dimmed">
                    {faq.answer}
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Reveal>
      </Stack>
    </Container>
  );
}
