/**
 * Routage Haiku/Sonnet — fonction pure et déterministe (pas d'appel LLM de
 * classification) : un appel de classification ajouterait un coût et une
 * latence sur CHAQUE requête, et serait non-déterministe, donc impossible à
 * tester précisément. Biais de sécurité volontaire : Sonnet par défaut,
 * Haiku réservé à un allowlist de signaux clairement simples. Un message
 * ambigu, ou combinant plusieurs domaines métier, part toujours sur Sonnet
 * — jamais l'inverse (voir règle absolue : ne jamais choisir Haiku
 * uniquement pour économiser si la requête nécessite objectivement Sonnet).
 */
export type ComplexityTier = 'simple' | 'complex';

const MAX_SIMPLE_MESSAGE_LENGTH = 140;
const COMPLEX_MESSAGE_LENGTH_THRESHOLD = 180;

// Priment sur tout signal "simple" : analyse, synthèse, raisonnement,
// comparaison, tendance, rapport de direction. Les variantes accentuées
// sont incluses explicitement (pas de normalisation Unicode) pour rester
// simple et sans dépendance.
const COMPLEX_PATTERNS: RegExp[] = [
  /\banalys/i, // analyse, analyser, analyses...
  /\bpourquoi\b/i,
  /\bcompar/i, // compare, comparaison, comparer...
  /\btendance/i,
  /\brapport\b/i,
  /\bsynth[eè]s/i, // synthese, synthèse...
  /\brecommand/i, // recommande, recommandation...
  /\bstrat[eé]gi/i, // strategie, stratégie, stratégique...
  /\bpriorit/i, // priorité, prioritaire, prioritaires...
  /\bexploitation\b/i,
  /\bbilan\b/i,
  /\bam[eé]liorer\b/i,
  /\boptimiser\b/i,
  /\binterpr[eé]t/i, // interprete, interprète, interpretation...
];

// Domaines métier distincts — en combiner plusieurs dans une même question
// est un signal fort d'analyse croisée (ex. "ventes, marge, stocks et
// achats"), même sans mot-clé d'analyse explicite.
const DOMAIN_PATTERNS: RegExp[] = [
  /\bvente/i,
  /\bstock/i,
  /\bachat/i,
  /\bfinanc/i, // finance, financier...
  /\bmarge/i,
  /\bfournisseur/i,
];

// N'est consulté QUE si aucun signal complexe n'a été détecté — un sous-
// ensemble volontairement restreint de demandes de comptage/consultation
// directe, correspondant exactement aux capacités "sans analyse" des
// outils ERP (produits, stock, ventes du jour, achats en attente...).
const SIMPLE_PATTERNS: RegExp[] = [
  /\bcombien\b/i,
  /\bliste\b/i,
  /\bquels? sont\b/i,
  /\bquels? produits?\b/i,
  /\bdisponible/i,
  /\brupture/i,
  /\ben attente\b/i,
  /\bfournisseurs?\b/i,
  /\bquand\b/i,
];

function countDistinctDomains(message: string): number {
  return DOMAIN_PATTERNS.reduce((count, pattern) => (pattern.test(message) ? count + 1 : count), 0);
}

/**
 * Classifie un seul message utilisateur. Appelée une fois par appel
 * `chat()`, sur le message le plus récent — la décision ne change jamais en
 * cours de boucle d'outils, pour éviter un changement de modèle au milieu
 * d'une même conversation.
 */
export function classifyComplexity(userMessage: string): ComplexityTier {
  const hasComplexSignal = COMPLEX_PATTERNS.some((pattern) => pattern.test(userMessage));
  if (hasComplexSignal) return 'complex';

  if (countDistinctDomains(userMessage) >= 3) return 'complex';

  if (userMessage.length > COMPLEX_MESSAGE_LENGTH_THRESHOLD) return 'complex';

  const hasSimpleSignal = SIMPLE_PATTERNS.some((pattern) => pattern.test(userMessage));
  if (hasSimpleSignal && userMessage.length <= MAX_SIMPLE_MESSAGE_LENGTH) {
    return 'simple';
  }

  // Par défaut (ambigu, hors domaine, ou aucun signal clair) : Sonnet.
  return 'complex';
}
