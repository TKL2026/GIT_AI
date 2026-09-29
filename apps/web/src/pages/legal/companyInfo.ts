/**
 * Informations d'identité de l'entreprise éditrice, utilisées par les pages
 * Mentions légales et Politique de confidentialité. Ce sont les seules
 * données que le code ne peut pas déduire lui-même (raison sociale, adresse,
 * numéro d'enregistrement, hébergeur...) — à compléter avant le lancement
 * public. Tant qu'un champ est vide, la page affiche honnêtement
 * "à compléter" au lieu d'une valeur inventée.
 */
export const COMPANY_INFO = {
  legalName: '',
  legalForm: '',
  registeredAddress: '',
  registrationNumber: '',
  contactEmail: '',
  publicationDirector: '',
  hostingProviderName: '',
  hostingProviderAddress: '',
};

export function orFallback(value: string): string {
  return value.trim().length > 0 ? value : 'à compléter';
}
