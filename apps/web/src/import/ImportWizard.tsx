import { Alert, Anchor, Badge, Button, Group, Select, Stack, Stepper, Text } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconFileSpreadsheet, IconX } from '@tabler/icons-react';
import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { buildImportTemplateCsv } from './buildImportTemplateCsv';
import type { ImportFieldDefinition } from './importFieldDefinitions';
import { ImportFileError, parseImportFile, type ParsedFile } from './parseImportFile';
import { suggestColumnMapping } from './suggestColumnMapping';

export interface ImportRowPayload {
  line: number;
  [key: string]: string | number;
}

export interface ImportResultError {
  line: number;
  message: string;
}

export interface ImportResult {
  importedCount: number;
  rejectedCount: number;
  errors: ImportResultError[];
}

interface ImportWizardProps {
  fields: ImportFieldDefinition[];
  onImport: (rows: ImportRowPayload[]) => Promise<ImportResult>;
  /** Utilisé au singulier/pluriel dans les libellés ("Importer 1 produit" / "Importer 2 produits"). */
  entityLabelSingular: string;
  /** Utilisé au pluriel et dans le nom du modèle téléchargeable. */
  entityLabelPlural: string;
  onFinished?: (result: ImportResult) => void;
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'result';

const STEP_INDEX: Record<WizardStep, number> = { upload: 0, mapping: 1, preview: 2, result: 3 };
const PREVIEW_ROW_LIMIT = 20;
const SKIP_VALUE = '__skip__';

function buildMappedRows(
  parsed: ParsedFile,
  fields: ImportFieldDefinition[],
  mapping: Record<string, number | null>,
): ImportRowPayload[] {
  return parsed.rows.map((row, index) => {
    const payload: ImportRowPayload = { line: index + 2 };
    for (const field of fields) {
      const columnIndex = mapping[field.key];
      payload[field.key] = columnIndex !== null && columnIndex !== undefined ? row[columnIndex] ?? '' : '';
    }
    return payload;
  });
}

function downloadTemplate(fields: ImportFieldDefinition[], fileLabel: string) {
  const blob = new Blob([buildImportTemplateCsv(fields)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `modele-${fileLabel}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ImportWizard({
  fields,
  onImport,
  entityLabelSingular,
  entityLabelPlural,
  onFinished,
}: ImportWizardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<WizardStep>('upload');
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<Record<string, number | null>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  function reset() {
    setStep('upload');
    setFileError(null);
    setFileName(null);
    setParsed(null);
    setMapping({});
    setImportError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileError(null);
    setFileName(file.name);

    try {
      const parsedFile = await parseImportFile(file);
      setParsed(parsedFile);
      setMapping(suggestColumnMapping(parsedFile.headers, fields));
      setStep('mapping');
    } catch (err) {
      setParsed(null);
      setFileError(err instanceof ImportFileError ? err.message : 'Impossible de lire ce fichier.');
    }
  }

  const missingRequiredFields = fields.filter(
    (f) => f.required && (mapping[f.key] === null || mapping[f.key] === undefined),
  );

  const unusedColumns = useMemo(() => {
    if (!parsed) return [];
    const usedIndexes = new Set(Object.values(mapping).filter((v): v is number => v !== null && v !== undefined));
    return parsed.headers.filter((_, i) => !usedIndexes.has(i)).filter((h) => h.trim() !== '');
  }, [parsed, mapping]);

  const mappedRows = useMemo(() => {
    if (!parsed) return [];
    return buildMappedRows(parsed, fields, mapping);
  }, [parsed, fields, mapping]);

  const previewColumns: DataTableColumn<ImportRowPayload>[] = [
    { key: 'line', label: 'Ligne', render: (r) => r.line },
    ...fields.map((f) => ({
      key: f.key,
      label: f.label,
      render: (r: ImportRowPayload) => String(r[f.key] ?? '').trim() || '—',
    })),
  ];

  async function handleImport() {
    setIsImporting(true);
    setImportError(null);
    try {
      const importResult = await onImport(mappedRows);
      setResult(importResult);
      setStep('result');
    } catch {
      setImportError("L'import a échoué de façon inattendue. Aucune donnée n'a été importée. Réessayez.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Stack gap="lg">
      <Stepper active={STEP_INDEX[step]} size="sm" iconSize={28} allowNextStepsSelect={false}>
        <Stepper.Step label="Fichier" />
        <Stepper.Step label="Association des colonnes" />
        <Stepper.Step label="Aperçu" />
        <Stepper.Step label="Résultat" />
      </Stepper>

      {step === 'upload' && (
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Choisissez un fichier CSV ou Excel (.xlsx). Vous associerez ensuite vous-même ses colonnes aux champs
            gérés par UGE.
          </Text>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <Group>
            <Button
              variant="light"
              leftSection={<IconFileSpreadsheet size={16} />}
              onClick={() => fileInputRef.current?.click()}
            >
              {fileName ?? 'Choisir un fichier'}
            </Button>
            <Anchor size="sm" onClick={() => downloadTemplate(fields, entityLabelPlural)}>
              Télécharger un modèle
            </Anchor>
          </Group>
          {fileError && (
            <Alert color="red" icon={<IconAlertCircle size={16} />}>
              {fileError}
            </Alert>
          )}
        </Stack>
      )}

      {step === 'mapping' && parsed && (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Associez chaque colonne de votre fichier au champ correspondant dans UGE. Seules les données prises en
            charge par UGE seront importées.
          </Text>

          <Stack gap="sm">
            {fields.map((field) => (
              <Group key={field.key} justify="space-between" wrap="nowrap" gap="md">
                <Stack gap={0} style={{ flex: 1 }}>
                  <Group gap={6}>
                    <Text fw={600} size="sm">
                      {field.label}
                    </Text>
                    {field.required ? (
                      <Badge size="xs" color="red" variant="light">
                        Obligatoire
                      </Badge>
                    ) : (
                      <Badge size="xs" color="gray" variant="light">
                        Facultatif
                      </Badge>
                    )}
                  </Group>
                  {field.description && (
                    <Text size="xs" c="dimmed">
                      {field.description}
                    </Text>
                  )}
                </Stack>
                <Select
                  style={{ width: 260 }}
                  placeholder="Choisir une colonne…"
                  data={[
                    ...(field.required ? [] : [{ value: SKIP_VALUE, label: 'Ne pas importer' }]),
                    ...parsed.headers.map((h, i) => ({ value: String(i), label: h.trim() || `Colonne ${i + 1}` })),
                  ]}
                  value={
                    mapping[field.key] === null || mapping[field.key] === undefined
                      ? field.required
                        ? null
                        : SKIP_VALUE
                      : String(mapping[field.key])
                  }
                  onChange={(value) =>
                    setMapping((prev) => ({
                      ...prev,
                      [field.key]: value === null || value === SKIP_VALUE ? null : Number(value),
                    }))
                  }
                />
              </Group>
            ))}
          </Stack>

          {missingRequiredFields.length > 0 && (
            <Alert color="orange" icon={<IconAlertCircle size={16} />}>
              Champs obligatoires non associés : {missingRequiredFields.map((f) => f.label).join(', ')}.
            </Alert>
          )}

          <Group justify="space-between">
            <Button variant="default" onClick={reset}>
              Annuler
            </Button>
            <Button onClick={() => setStep('preview')} disabled={missingRequiredFields.length > 0}>
              Voir l'aperçu
            </Button>
          </Group>
        </Stack>
      )}

      {step === 'preview' && parsed && (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Aperçu des données telles qu'elles seront importées dans UGE ({parsed.rows.length} ligne
            {parsed.rows.length > 1 ? 's' : ''} au total
            {mappedRows.length > PREVIEW_ROW_LIMIT ? `, ${PREVIEW_ROW_LIMIT} premières affichées` : ''}).
          </Text>

          <DataTable columns={previewColumns} rows={mappedRows.slice(0, PREVIEW_ROW_LIMIT)} rowKey={(r) => String(r.line)} />

          {unusedColumns.length > 0 && (
            <Alert color="gray" variant="light" icon={<IconAlertCircle size={16} />}>
              <Text size="sm" fw={600}>
                {unusedColumns.length} colonne{unusedColumns.length > 1 ? 's' : ''} ne{' '}
                {unusedColumns.length > 1 ? 'seront' : 'sera'} pas importée{unusedColumns.length > 1 ? 's' : ''} :{' '}
                {unusedColumns.join(', ')}
              </Text>
              <Text size="xs" c="dimmed">
                Ces colonnes ne correspondent à aucun champ actuellement géré par UGE et ne seront pas importées.
              </Text>
            </Alert>
          )}

          {importError && (
            <Alert color="red" icon={<IconX size={16} />}>
              {importError}
            </Alert>
          )}

          <Group justify="space-between">
            <Group>
              <Button variant="default" onClick={() => setStep('mapping')} disabled={isImporting}>
                Retour au mapping
              </Button>
              <Button variant="subtle" color="gray" onClick={reset} disabled={isImporting}>
                Annuler
              </Button>
            </Group>
            <Button onClick={handleImport} loading={isImporting}>
              Importer {mappedRows.length} {mappedRows.length > 1 ? entityLabelPlural : entityLabelSingular}
            </Button>
          </Group>
        </Stack>
      )}

      {step === 'result' && result && (
        <Stack gap="md">
          <Alert
            color={result.rejectedCount === 0 ? 'emerald' : result.importedCount === 0 ? 'red' : 'orange'}
            icon={result.rejectedCount === 0 ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
          >
            <Text fw={600}>
              Import terminé avec {result.importedCount} ligne{result.importedCount > 1 ? 's' : ''} importée
              {result.importedCount > 1 ? 's' : ''}
              {result.rejectedCount > 0
                ? ` et ${result.rejectedCount} ligne${result.rejectedCount > 1 ? 's' : ''} rejetée${result.rejectedCount > 1 ? 's' : ''}`
                : ''}
              .
            </Text>
          </Alert>

          {result.errors.length > 0 && (
            <Alert color="red" variant="light" icon={<IconX size={16} />}>
              <Text size="sm" fw={600} mb={4}>
                Lignes rejetées :
              </Text>
              <Stack gap={2}>
                {result.errors.map((e, i) => (
                  <Text size="sm" key={i}>
                    {e.line > 0 ? `- ligne ${e.line} : ${e.message}` : `- ${e.message}`}
                  </Text>
                ))}
              </Stack>
            </Alert>
          )}

          <Group justify="flex-end">
            <Button
              onClick={() => {
                onFinished?.(result);
                reset();
              }}
            >
              Terminer
            </Button>
          </Group>
        </Stack>
      )}
    </Stack>
  );
}
