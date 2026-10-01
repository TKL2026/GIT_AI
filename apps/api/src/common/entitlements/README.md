# Entitlements (Plan → Fonctionnalités → Autorisations)

Ce module répond à une seule question : **cette organisation a-t-elle le droit
d'utiliser cette fonctionnalité, avec son abonnement actuel ?** — et c'est le
backend, jamais le frontend, qui répond.

## Vue d'ensemble

```
Subscription (status: TRIAL | AWAITING_PAYMENT | ACTIVE | EXPIRED | ...)
    ↓
Plan (si ACTIVE)
    ↓
Plan.features JSON  →  { maxUsers: number | null, features: Feature[] }
    ↓
EntitlementsService.getFeatures(organizationId) → Set<Feature>
    ↓
FeatureGuard (garde global, lit @RequireFeature sur l'endpoint)
    ↓
Controller
```

La liste des rôles (OWNER/ADMIN/DIRECTOR/...) reste une dimension **séparée**
et orthogonale, gérée par `RolesGuard`/`@Roles(...)` — un plan ne donne
jamais un rôle, un rôle ne donne jamais un plan. Les deux gardes s'appliquent
indépendamment sur le même endpoint quand c'est nécessaire.

## Source unique de vérité

Les codes de fonctionnalités (`FEATURES`, `STANDARD_FEATURES`,
`PRO_FEATURES`, le type `Feature`, et la forme `PlanFeaturesJson`) vivent
dans **`packages/shared/src/features.ts`** — importés tels quels par l'API
(`@copilote/shared`) et par le frontend. Ne jamais recréer une deuxième
liste ailleurs (ni dans un controller, ni dans React, ni dans le marketing).

`apps/api/prisma/seed.ts` écrit ces listes dans `Plan.features` en base ; si
tu modifies `packages/shared/src/features.ts`, il faut reconstruire le
package (`npm run build` dans `packages/shared`) **et** relancer le seed
(`npm run prisma:seed` dans `apps/api`) pour que les `Plan` existants en
base soient mis à jour (l'upsert du seed écrase `features`/`price`/`name`
sur les lignes déjà présentes).

## Résolution des fonctionnalités (`EntitlementsService.getFeatures`)

| Statut de la Subscription | Fonctionnalités accordées | Pourquoi |
|---|---|---|
| Pas de ligne `Subscription` | `PRO_FEATURES` (tout) | Accès libre historique (compte démo, organisations créées avant l'introduction des abonnements) — comportement préexistant conservé, voir `isSubscriptionLocked`. |
| `TRIAL` (jamais verrouillé à ce stade, `SubscriptionGuard` a déjà laissé passer) | `PRO_FEATURES` (tout) | L'essai gratuit donne le même niveau que Pro pendant 48h, par exigence produit. |
| `ACTIVE` | `subscription.plan.features.features` exactement | Le plan payé est la seule source de vérité une fois actif. |
| Tout le reste (`AWAITING_PAYMENT`, `EXPIRED`, `PAST_DUE`, `CANCELLED`) | Aucune | Filet de sécurité — ne devrait jamais être atteint en pratique, `SubscriptionGuard` bloque déjà ces statuts avant que `FeatureGuard` ne s'exécute. |

## Protéger un nouvel endpoint Pro

1. Vérifier que le code de fonctionnalité existe dans
   `packages/shared/src/features.ts` (sinon l'ajouter à `FEATURES` et à
   `PRO_ONLY_FEATURES` — jamais à la fois dans Standard ET Pro, l'héritage
   via `PRO_FEATURES = [...STANDARD_FEATURES, ...PRO_ONLY_FEATURES]` s'en
   charge).
2. Ajouter le décorateur sur le controller ou la méthode :
   ```ts
   import { FEATURES } from '@copilote/shared';
   import { RequireFeature } from '../../common/decorators/require-feature.decorator';

   @RequireFeature(FEATURES.MA_NOUVELLE_FEATURE)
   @Controller('mon-module')
   export class MonController { ... }
   ```
   Peut aussi s'appliquer au niveau d'une seule méthode (voir
   `finance.controller.ts` : `getSummary` est `FINANCE_BASIC`, mais
   `getProductsProfitability`/`getMonthlyTrend` sont `FINANCE_ADVANCED` —
   le décorateur au niveau méthode l'emporte sur celui de la classe, via
   `Reflector.getAllAndOverride`, exactement comme `@Roles`).
3. Rebuild `packages/shared`, relancer le seed si un plan doit désormais
   inclure cette fonctionnalité.
4. Ne rien faire côté `SubscriptionGuard`/`RolesGuard` — ils continuent de
   s'appliquer indépendamment, dans l'ordre `ThrottlerGuard → JwtAuthGuard →
   SubscriptionGuard → FeatureGuard → RolesGuard` (voir `app.module.ts`).

**Ne pas garder une fonctionnalité qui n'a pas d'implémentation distincte.**
Exemple concret : le Copilot IA n'a qu'une seule implémentation (`chat`,
`daily-report`) — pas de version "avancée" séparée dans le code. Il n'existe
donc qu'un seul code `COPILOT_BASIC`, inclus dans Standard (et donc Pro).
Ne pas inventer un `COPILOT_ADVANCED` qui ne gardera rien de réel.

## Limite de sièges (`Plan.features.maxUsers`)

Appliquée dans `apps/api/src/modules/invites/invites.service.ts`
(`createRespectingSeatLimit`) : compte `User` + `PendingInvite` non expirées
et non acceptées de l'organisation, refuse (403, `code: 'SEAT_LIMIT_REACHED'`)
si `utilisateurs + invitations en attente >= maxUsers`. `maxUsers: null`
(Pro) = illimité. La vérification + la création se font dans une **seule
transaction Prisma en isolation Serializable** : deux invitations envoyées
au même instant ne peuvent jamais dépasser la limite ensemble — l'une des
deux échoue avec un conflit de sérialisation (`P2034`) et est
automatiquement retentée (jusqu'à 3 fois) avec un compte à jour.

Pour changer la limite d'un plan : modifier `maxUsers` dans
`apps/api/prisma/seed.ts`, rebuild, reseed.

## Modifier les limites/fonctionnalités d'un plan existant

1. Éditer `PLANS` dans `apps/api/prisma/seed.ts` (prix, `maxUsers`, ou la
   composition `STANDARD_FEATURES`/`PRO_ONLY_FEATURES` dans
   `packages/shared/src/features.ts`).
2. `npm run build` dans `packages/shared`.
3. `npm run prisma:seed` dans `apps/api` (l'upsert met à jour les lignes
   `Plan` existantes — ne crée pas de doublon).
4. Les organisations déjà `ACTIVE` sur ce plan voient le changement
   immédiatement au prochain appel (`EntitlementsService` relit toujours la
   base, aucun cache).

## Frontend (UX uniquement, jamais la sécurité)

`GET /organizations/me` renvoie un champ `features: Feature[]` (calculé par
`EntitlementsService`, jamais stocké/deviné côté client). Le frontend
(`apps/web/src/lib/entitlements.ts`, fonction `hasFeature(organization,
feature)`) l'utilise uniquement pour masquer des liens de navigation, des
onglets ou des boutons — jamais comme mécanisme de sécurité. Si un appel API
correspondant est fait malgré tout (URL directe, DevTools, Postman),
`FeatureGuard` le refuse avec `403 { code: 'FEATURE_NOT_INCLUDED' }`, que le
frontend affiche via la notification d'erreur générique déjà en place dans
`apps/web/src/main.tsx` (`queryCache.onError`).

## Tester les permissions

- `entitlements.service.spec.ts` — résolution des fonctionnalités par statut.
- `feature.guard.spec.ts` — comportement du garde (laisse passer / bloque / 403).
- `invites.service.spec.ts` — limite de sièges, y compris le retry sur
  conflit de sérialisation.
- `test/entitlements.e2e-spec.ts` — parcours complets Standard/Pro/Trial,
  isolation multi-tenant, impossibilité d'imposer un prix depuis le
  frontend, refus réel (403) d'un appel direct à un endpoint Pro avec un
  compte Standard.

## Connu, non implémenté (voir le rapport de mission pour le détail)

- Pas de distinction technique "Copilot basique vs avancé" — un seul niveau
  existe dans le code, inclus dans Standard.
- Pas de flux dédié de changement d'offre (upgrade/downgrade) : rappeler
  `/billing/checkout` avec un autre `planId` fonctionne mais **n'est pas
  proratisé** — voir le rapport de mission, section "Risques restants".
