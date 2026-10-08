import Papa from 'papaparse';

export interface ParsedFile {
  headers: string[];
  rows: string[][];
}

export class ImportFileError extends Error {}

/** Limites volontairement modestes (section 11) : les besoins actuels de
 * UGE sont ceux d'une PME, pas d'un système d'import industriel. */
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 5000;

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function isBlankRow(row: string[]): boolean {
  return row.every((cell) => cell.trim() === '');
}

/** FileReader plutôt que `file.text()`/`file.arrayBuffer()` : compatibilité
 * plus large (y compris anciens navigateurs) et évite une dépendance aux
 * méthodes Blob natives absentes de certains environnements de test. */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Lecture du fichier échouée.'));
    reader.readAsText(file);
  });
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error('Lecture du fichier échouée.'));
    reader.readAsArrayBuffer(file);
  });
}

async function parseCsvFile(file: File): Promise<ParsedFile> {
  const text = await readFileAsText(file);
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
  const data = parsed.data.filter((row) => Array.isArray(row));
  if (data.length === 0) {
    return { headers: [], rows: [] };
  }

  const [headerRow, ...rest] = data;
  const headers = headerRow.map((h) => (h ?? '').trim());
  const rows = rest
    .map((row) => headers.map((_, i) => (row[i] ?? '').trim()))
    .filter((row) => !isBlankRow(row));

  return { headers, rows };
}

async function parseXlsxFile(file: File): Promise<ParsedFile> {
  // Chargement différé : évite d'alourdir le bundle principal pour une
  // fonctionnalité utilisée ponctuellement (import).
  const XLSX = await import('xlsx');
  const buffer = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(buffer, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return { headers: [], rows: [] };

  const sheet = workbook.Sheets[firstSheetName];
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '' });
  if (data.length === 0) return { headers: [], rows: [] };

  const [headerRow, ...rest] = data;
  const headers = headerRow.map((h) => cellToString(h));
  const rows = rest
    .map((row) => headers.map((_, i) => cellToString(row[i])))
    .filter((row) => !isBlankRow(row));

  return { headers, rows };
}

/**
 * Lit un fichier .csv/.xlsx et retourne ses colonnes brutes, sans
 * interprétation métier : UGE n'exécute rien provenant du fichier, il ne
 * fait que lire des cellules (section 11).
 */
export async function parseImportFile(file: File): Promise<ParsedFile> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ImportFileError('Ce fichier est trop volumineux (maximum 10 Mo).');
  }

  const name = file.name.toLowerCase();
  const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');

  let result: ParsedFile;
  try {
    result = isExcel ? await parseXlsxFile(file) : await parseCsvFile(file);
  } catch {
    throw new ImportFileError('Impossible de lire ce fichier. Vérifiez qu’il s’agit bien d’un fichier CSV ou Excel valide.');
  }

  if (result.headers.length === 0) {
    throw new ImportFileError('Le fichier ne contient aucune colonne. Vérifiez son format.');
  }
  if (result.rows.length === 0) {
    throw new ImportFileError('Le fichier ne contient aucune ligne de données (seulement des en-têtes).');
  }
  if (result.rows.length > MAX_IMPORT_ROWS) {
    throw new ImportFileError(
      `Ce fichier contient trop de lignes (${result.rows.length}). La limite est de ${MAX_IMPORT_ROWS} lignes par import : divisez votre fichier en plusieurs imports.`,
    );
  }

  return result;
}
