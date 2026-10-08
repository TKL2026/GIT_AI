import Papa from 'papaparse';
import type { ImportFieldDefinition } from './importFieldDefinitions';

/** Modèle téléchargeable générique : une colonne par champ UGE, dans
 * l'ordre déclaré par `fields`. Purement indicatif — l'utilisateur reste
 * libre d'utiliser ses propres en-têtes, il les associera lui-même à
 * l'étape de mapping. */
export function buildImportTemplateCsv(fields: ImportFieldDefinition[]): string {
  return Papa.unparse({
    fields: fields.map((f) => f.label),
    data: [],
  });
}
