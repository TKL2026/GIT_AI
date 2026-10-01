import type { Feature, OrganizationDto } from '@copilote/shared';

/**
 * UX uniquement — permet d'afficher/masquer une fonctionnalité. La sécurité
 * réelle est appliquée côté backend par FeatureGuard (voir
 * apps/api/src/common/guards/feature.guard.ts) : même si ce contrôle était
 * contourné ici, l'appel API correspondant échouerait avec 403
 * FEATURE_NOT_INCLUDED.
 */
export function hasFeature(organization: OrganizationDto | undefined, feature: Feature): boolean {
  return organization?.features.includes(feature) ?? false;
}
