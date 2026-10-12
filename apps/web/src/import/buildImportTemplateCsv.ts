import Papa from 'papaparse';
import type { ImportFieldDefinition } from './importFieldDefinitions';

/** Modèle téléchargeable générique : une colonne par champ UGE, dans
 * l'ordre déclaré par `fields`. Purement indicatif — l'utilisateur reste
 * libre d'utiliser ses propres en-têtes, il les associera lui-même à
 * l'étape de mapping. */
export function buildImportTemplateCsv(fields: ImportFieldDefinition[]): string {
  const csv = Papa.unparse({
    fields: fields.map((f) => f.label),
    data: [],
  });
  // BOM UTF-8 : sans lui, Excel (surtout en français sur Windows) ouvre le
  // fichier en ANSI/CP1252 au lieu d'UTF-8 et affiche les accents comme des
  // caractères illisibles ("D�signation" au lieu de "Désignation").
  return `﻿${csv}`;
}
