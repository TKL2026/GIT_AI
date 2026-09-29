import { Accordion, Container, Stack, Text, Title } from '@mantine/core';
import { Reveal } from '../Reveal';

const FAQS = [
  {
    question: "Qu'est-ce que Copilote IA Business ?",
    answer:
      'Un logiciel de gestion — stock, ventes, achats, finance — enrichi d\'un copilote intelligent qui analyse vos données et vous aide à prendre de meilleures décisions.',
  },
  {
    question: 'Est-ce uniquement un logiciel de gestion de stock ?',
    answer:
      "Non. Le stock n'est qu'un des modules : vous gérez aussi vos ventes, vos achats et vos finances, avec un copilote IA connecté à l'ensemble de ces données.",
  },
  {
    question: 'Comment fonctionne le Copilote IA ?',
    answer:
      'Il analyse les données réelles de votre entreprise pour répondre à vos questions et vous proposer des recommandations concrètes.',
  },
  {
    question: 'Quelles données peut-il analyser ?',
    answer: 'Vos produits, votre stock, vos ventes, vos achats et vos finances, tels qu\'ils sont enregistrés dans votre espace.',
  },
  {
    question: 'Puis-je utiliser WhatsApp ?',
    answer:
      'Oui, vous pouvez recevoir des notifications et des rapports directement sur WhatsApp, selon les fonctionnalités actuellement disponibles.',
  },
  {
    question: 'Mes données sont-elles séparées des autres entreprises ?',
    answer: 'Oui. Chaque organisation dispose de ses propres données, totalement séparées de celles des autres entreprises.',
  },
  {
    question: 'Puis-je ajouter plusieurs utilisateurs ?',
    answer: "Oui, vous pouvez inviter votre équipe et attribuer à chacun un rôle adapté.",
  },
  {
    question: 'Combien de temps faut-il pour commencer ?',
    answer: 'Quelques minutes : créez votre espace, ajoutez vos produits, et vous êtes opérationnel.',
  },
  {
    question: 'Copilote IA Business est-il adapté aux PME ?',
    answer: 'Oui, la solution est pensée pour les PME qui vendent et qui stockent, où qu\'elles se trouvent.',
  },
  {
    question: 'Puis-je essayer gratuitement ?',
    answer: 'Oui, vous pouvez créer votre espace gratuitement, sans carte bancaire.',
  },
  {
    question: "Comment fonctionne l'abonnement ?",
    answer: 'Notre tarification est en cours de finalisation. Pour l\'instant, commencez gratuitement ou contactez-nous pour en discuter.',
  },
];

export function FaqSection() {
  return (
    <Container size="md" py={80} id="faq">
      <Stack gap="xl">
        <Reveal>
          <Stack gap="xs" ta="center" align="center">
            <Title order={2} fz={{ base: 26, sm: 32 }}>
              Questions fréquentes
            </Title>
            <Text c="dimmed" size="lg">
              Tout ce que vous devez savoir avant de commencer.
            </Text>
          </Stack>
        </Reveal>

        <Reveal delay={80}>
          <Accordion variant="separated" radius="lg">
            {FAQS.map((faq) => (
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
