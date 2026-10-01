import { SetMetadata } from "@nestjs/common";
import type { Feature } from "@copilote/shared";

export const REQUIRE_FEATURE_KEY = "requireFeature";

/** Marque un endpoint comme nécessitant une fonctionnalité précise de
 * l'offre de l'organisation appelante — vérifié par FeatureGuard, jamais
 * par le frontend. Voir apps/api/src/common/entitlements/features.ts pour
 * la liste des codes valides. */
export const RequireFeature = (feature: Feature) =>
  SetMetadata(REQUIRE_FEATURE_KEY, feature);
