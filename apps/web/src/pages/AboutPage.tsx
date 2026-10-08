import { Anchor, Center, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Seo } from '../components/Seo';

export function AboutPage() {
  return (
    <>
      <Seo
        title="UGE | À propos"
        description="Découvrez pourquoi UGE a été créé : réunir stock, ventes, achats et finance dans un seul espace, avec une intelligence artificielle qui aide les PME à décider plus vite."
        path="/a-propos"
      />
      <Center mih="100vh" p="md" style={{ alignItems: 'flex-start' }}>
      <Stack w="100%" maw={720} gap="xl" py="xl">
        <Stack gap="md">
          <Center>
            <Logo size="md" />
          </Center>
          <Anchor
            component={Link}
            to="/"
            size="sm"
            c="dimmed"
            display="inline-flex"
            style={{ alignItems: 'center', gap: 4 }}
          >
            <IconArrowLeft size={14} /> Retour à l'accueil
          </Anchor>
        </Stack>

        <Stack gap="xs">
          <Title order={1} fz={{ base: 28, sm: 34 }}>
            À propos de UGE
          </Title>
          <Text size="lg" c="dimmed">
            Un Copilote IA pour les entreprises qui vendent et qui stockent.
          </Text>
        </Stack>

        <Stack gap="sm">
          <Title order={3} fz={20}>
            Le problème que nous cherchons à résoudre
          </Title>
          <Text c="dimmed">
            Beaucoup d'entreprises gèrent leur stock, leurs ventes, leurs achats et leurs finances
            avec des outils dispersés, ou avec des informations qui n'arrivent que trop tard.
            Résultat : des décisions prises à l'aveugle, du temps perdu, et des opportunités
            manquées.
          </Text>
        </Stack>

        <Stack gap="sm">
          <Title order={3} fz={20}>
            Pourquoi nous avons créé UGE
          </Title>
          <Text c="dimmed">
            Nous pensons que la gestion d'entreprise ne devrait pas être compliquée, et que les
            données d'une entreprise devraient réellement l'aider à avancer — pas seulement être
            enregistrées quelque part. UGE réunit stock, ventes, achats et
            finance dans un seul espace, et y ajoute une intelligence artificielle capable de lire
            ces données pour vous aider à les comprendre et à agir.
          </Text>
        </Stack>

        <Stack gap="sm">
          <Title order={3} fz={20}>
            Notre vision
          </Title>
          <Text c="dimmed">
            Simplifier la gestion des PME et rendre le pilotage d'entreprise plus intelligent grâce
            à l'intelligence artificielle — pour que chaque dirigeant, quelle que soit la taille de
            son équipe, puisse comprendre son activité aussi clairement qu'une grande entreprise
            dotée de moyens analytiques importants.
          </Text>
        </Stack>

        <Stack gap="sm">
          <Title order={3} fz={20}>
            Une ambition internationale
          </Title>
          <Text c="dimmed">
            UGE est conçu pour s'adapter à des entreprises de toutes tailles, où
            qu'elles se trouvent — sans se limiter à une seule région du monde. Notre objectif est
            de construire un produit utile partout où des entreprises vendent et stockent.
          </Text>
        </Stack>

        <Text size="sm" c="dimmed">
          Cette page évoluera à mesure que le projet grandit.
        </Text>
      </Stack>
      </Center>
    </>
  );
}
