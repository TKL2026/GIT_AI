export const DEFAULT_ORGANIZATION_NAME = 'Mon entreprise';

export const COUNTRY_OPTIONS = [
  'Cameroun',
  "Côte d'Ivoire",
  'Sénégal',
  'Mali',
  'Burkina Faso',
  'Bénin',
  'Togo',
  'Niger',
  'Gabon',
  'Congo',
  'RD Congo',
  'Nigeria',
  'Ghana',
  'Guinée',
  'Tchad',
  'République centrafricaine',
  'Autre',
];

export const INDUSTRY_OPTIONS = [
  { value: 'commerce', label: 'Commerce / Boutique' },
  { value: 'distribution', label: 'Distribution / Grossiste' },
  { value: 'restaurant', label: 'Restaurant / Alimentation' },
  { value: 'pharmacie', label: 'Pharmacie / Santé' },
  { value: 'mode', label: 'Mode / Habillement' },
  { value: 'electronique', label: 'Électronique' },
  { value: 'services', label: 'Services' },
  { value: 'autre', label: 'Autre' },
];

export const MODULE_OPTIONS = [
  { value: 'stock', label: 'Stock' },
  { value: 'sales', label: 'Ventes' },
  { value: 'purchases', label: 'Achats' },
  { value: 'finance', label: 'Finance' },
];

export const TEAM_SIZE_OPTIONS = [
  { value: '1', label: '1' },
  { value: '2-5', label: '2 – 5' },
  { value: '6-20', label: '6 – 20' },
  { value: '20+', label: '20+' },
];

const COUNTRY_BY_LOCALE_REGION: Record<string, string> = {
  CM: 'Cameroun',
  CI: "Côte d'Ivoire",
  SN: 'Sénégal',
  ML: 'Mali',
  BF: 'Burkina Faso',
  BJ: 'Bénin',
  TG: 'Togo',
  NE: 'Niger',
  GA: 'Gabon',
  CG: 'Congo',
  CD: 'RD Congo',
  NG: 'Nigeria',
  GH: 'Ghana',
  GN: 'Guinée',
  TD: 'Tchad',
  CF: 'République centrafricaine',
};

/** Simple pré-remplissage basé sur la locale du navigateur — pas de service
 * de géolocalisation, toujours modifiable par l'utilisateur. */
export function guessCountryFromLocale(): string | null {
  const region = navigator.language?.split('-')[1]?.toUpperCase();
  return region ? (COUNTRY_BY_LOCALE_REGION[region] ?? null) : null;
}
