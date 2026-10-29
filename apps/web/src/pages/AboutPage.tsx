import { Blockquote, Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconArrowRight, IconQuote } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import '../marketing/marketing.css';
import { MarketingFooter } from '../marketing/MarketingFooter';
import { MarketingHeader } from '../marketing/MarketingHeader';
import { Reveal } from '../marketing/Reveal';

export function AboutPage() {
  return (
    <>
      <Seo
        title="UGE | À propos"
        description="UGE (Ulric Gestion Entreprise) associe outils de gestion et intelligence artificielle pour aider les entreprises, en priorité au Cameroun, à mieux comprendre et piloter leur activité."
        path="/a-propos"
      />
      <MarketingHeader />
      <main>
        <Container size="lg" pt={{ base: 48, sm: 72 }} pb={{ base: 32, sm: 48 }}>
          <Reveal>
            <Stack gap="md" maw={720}>
              <Title order={1} fz={{ base: 28, sm: 38 }}>
                À propos de UGE
              </Title>
              <Text size="lg" fw={500} c="emerald.7">
                Une gestion plus claire. Des décisions mieux éclairées.
              </Text>
              <Text c="dimmed" size="lg">
                UGE (Ulric Gestion Entreprise) est une solution de gestion d'entreprise qui associe
                des outils de gestion et l'intelligence artificielle pour aider les entreprises à
                mieux comprendre et piloter leur activité.
              </Text>
              <Text c="dimmed" size="lg">
                Notre objectif : réunir les informations essentielles de l'entreprise dans un même
                espace — stocks, ventes, achats, fournisseurs et finances — et les rendre plus
                utiles au quotidien.
              </Text>
              <Text c="dimmed" size="lg">
                Parce que bien gérer une entreprise ne consiste pas seulement à enregistrer des
                données, mais aussi à savoir les interpréter et à prendre les bonnes décisions.
              </Text>
            </Stack>
          </Reveal>
        </Container>

        <Container size="lg" py={{ base: 32, sm: 48 }}>
          <Reveal>
            <Stack gap="md" maw={720}>
              <Title order={2} fz={{ base: 24, sm: 30 }}>
                Le problème que nous voulons résoudre
              </Title>
              <Text c="dimmed" size="lg">
                Gérer une entreprise implique de suivre de nombreuses informations, souvent
                dispersées entre plusieurs outils ou difficiles à exploiter.
              </Text>
              <Text c="dimmed" size="lg">
                Lorsque la visibilité sur les stocks, les ventes, les achats ou les finances est
                insuffisante, il devient plus difficile d'anticiper les besoins, de repérer les
                problèmes et de décider des actions à entreprendre.
              </Text>
              <Text c="dimmed" size="lg">
                Nous pensons que les entreprises méritent des outils qui leur permettent de mieux
                comprendre leur situation et de consacrer davantage de temps au développement de
                leur activité.
              </Text>
              <Text fw={600} size="lg">
                C'est cette conviction qui est au cœur de UGE.
              </Text>
            </Stack>
          </Reveal>
        </Container>

        <Container size="lg" py={{ base: 32, sm: 48 }}>
          <Reveal>
            <Stack gap="md" maw={720}>
              <Title order={2} fz={{ base: 24, sm: 30 }}>
                Une gestion qui va plus loin grâce à l'IA
              </Title>
              <Text c="dimmed" size="lg">
                UGE rassemble les principales fonctions de gestion de l'entreprise dans un même
                environnement : produits et stocks, ventes, achats, fournisseurs et suivi
                financier.
              </Text>
              <Text c="dimmed" size="lg">
                Son copilote IA aide à analyser les données disponibles, à faire ressortir des
                points d'attention et à proposer des pistes d'action pour éclairer les décisions
                du dirigeant.
              </Text>
              <Text c="dimmed" size="lg">
                Notre approche est simple : la technologie doit être utile, compréhensible et au
                service des personnes qui font vivre l'entreprise. L'intelligence artificielle ne
                remplace pas le jugement du dirigeant ; elle doit l'aider à mieux exploiter les
                informations dont il dispose.
              </Text>
            </Stack>
          </Reveal>
        </Container>

        <Container size="lg" py={{ base: 32, sm: 48 }}>
          <Reveal>
            <Stack gap="md" maw={720}>
              <Title order={2} fz={{ base: 24, sm: 30 }}>
                Une vision tournée vers les entreprises camerounaises
              </Title>
              <Text c="dimmed" size="lg">
                Nous voulons contribuer à rendre les outils de gestion et d'analyse plus
                accessibles aux entrepreneurs et aux PME, en tenant compte de leurs besoins
                concrets.
              </Text>
              <Text c="dimmed" size="lg">
                Le Cameroun est notre premier marché cible. Notre ambition est d'y développer une
                solution pratique et évolutive, capable de s'améliorer au fil des besoins des
                entreprises qui l'utilisent.
              </Text>
            </Stack>
          </Reveal>
        </Container>

        <Paper radius={0} py={{ base: 48, sm: 72 }} style={{ background: 'var(--mantine-color-emerald-0)' }}>
          <Container size="lg">
            <Reveal>
              <Stack gap="md" maw={720}>
                <Title order={2} fz={{ base: 24, sm: 30 }}>
                  Le fondateur de UGE
                </Title>
                <Text c="dimmed" size="lg">
                  Derrière UGE, il y a Ulric Fotso, son fondateur, et une conviction : la gestion
                  d'une entreprise ne devrait pas être inutilement compliquée.
                </Text>
                <Blockquote color="emerald" icon={<IconQuote size={20} />} radius="md" mt="sm">
                  <Text size="lg">
                    Ma vision est de rapprocher la gestion d'entreprise et l'intelligence
                    artificielle pour aider les entrepreneurs à mieux comprendre leur activité et à
                    prendre des décisions éclairées.
                  </Text>
                  <Text size="lg" mt="sm">
                    À travers UGE, je souhaite construire une solution utile, adaptée aux réalités
                    des entreprises camerounaises et pensée pour évoluer avec elles, avec une
                    priorité constante : apporter une valeur réelle à ceux qui nous feront
                    confiance.
                  </Text>
                </Blockquote>
                <Text size="sm" c="dimmed" fw={500}>
                  — Ulric Fotso, fondateur de UGE
                </Text>
              </Stack>
            </Reveal>
          </Container>
        </Paper>

        <Container size="lg" py={80}>
          <Reveal>
            <Paper radius="lg" p={{ base: 'xl', sm: 60 }} style={{ background: 'var(--mantine-color-emerald-9)' }}>
              <Stack align="center" ta="center" gap="md">
                <Title order={2} c="white" fz={{ base: 24, sm: 30 }}>
                  Découvrez UGE
                </Title>
                <Text c="emerald.1" size="lg" maw={520}>
                  Découvrez comment UGE peut vous aider à centraliser vos opérations et à mieux
                  comprendre votre activité.
                </Text>
                <Group gap="sm" justify="center">
                  <Button
                    component={Link}
                    to="/"
                    size="md"
                    color="white"
                    variant="white"
                    c="emerald.9"
                    rightSection={<IconArrowRight size={16} />}
                  >
                    Découvrir UGE
                  </Button>
                  <Button component={Link} to="/contact" size="md" variant="outline" color="white">
                    Nous contacter
                  </Button>
                </Group>
              </Stack>
            </Paper>
          </Reveal>
        </Container>
      </main>
      <MarketingFooter />
    </>
  );
}
