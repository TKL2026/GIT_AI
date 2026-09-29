import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  Progress,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconFileSpreadsheet,
  IconPackage,
  IconPlus,
  IconX,
  type Icon,
} from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductFormModal } from '../products/ProductFormModal';
import { useProducts } from '../../hooks/useProducts';
import { productsApi } from '../../api/products';
import { useUpdateOrganization } from '../../hooks/useOrganization';
import { ApiError } from '../../lib/apiClient';
import { OnboardingShell } from '../../onboarding/OnboardingShell';
import { buildProductsCsvTemplate, parseProductsCsv, type ParsedProductRow, type ProductsCsvParseError } from '../../onboarding/parseProductsCsv';

type Mode = 'choose' | 'import' | 'manual';

function OptionCard({
  icon: IconComponent,
  title,
  description,
  onClick,
  active,
}: {
  icon: Icon;
  title: string;
  description: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <Card
      component="button"
      type="button"
      onClick={onClick}
      padding="lg"
      withBorder
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        borderColor: active ? 'var(--mantine-color-emerald-6)' : undefined,
        borderWidth: active ? 2 : 1,
      }}
    >
      <IconComponent size={24} color="var(--mantine-color-emerald-6)" />
      <Text fw={600} mt="sm">
        {title}
      </Text>
      <Text size="sm" c="dimmed">
        {description}
      </Text>
    </Card>
  );
}

function downloadCsvTemplate() {
  const blob = new Blob([buildProductsCsvTemplate()], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'modele-produits.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function ImportPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedProductRow[]>([]);
  const [parseErrors, setParseErrors] = useState<ProductsCsvParseError[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImportedCount(0);
    setImportErrors([]);
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseProductsCsv(String(reader.result));
      setRows(result.rows);
      setParseErrors(result.errors);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setIsImporting(true);
    setProgress(0);
    const failures: string[] = [];
    let done = 0;

    for (const row of rows) {
      try {
        await productsApi.create({
          name: row.name,
          sku: row.sku,
          purchasePrice: row.purchasePrice,
          salePrice: row.salePrice,
          initialStock: row.initialStock,
        });
      } catch (err) {
        failures.push(`Ligne ${row.line} (${row.name}) : ${err instanceof ApiError ? err.message : 'échec.'}`);
      }
      done += 1;
      setProgress(Math.round((done / rows.length) * 100));
    }

    setImportedCount(rows.length - failures.length);
    setImportErrors(failures);
    setIsImporting(false);
    setRows([]);
  }

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Colonnes attendues : nom, sku, prix_achat, prix_vente, stock_initial (optionnelle).{' '}
        <Anchor size="sm" onClick={downloadCsvTemplate}>
          Télécharger le modèle
        </Anchor>
      </Text>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <Button variant="light" onClick={() => fileInputRef.current?.click()} leftSection={<IconFileSpreadsheet size={16} />}>
        {fileName ?? 'Choisir un fichier CSV'}
      </Button>

      {parseErrors.length > 0 && (
        <Alert color="red" icon={<IconAlertCircle size={16} />}>
          <Stack gap={4}>
            {parseErrors.slice(0, 5).map((e, i) => (
              <Text size="sm" key={i}>
                {e.line > 0 ? `Ligne ${e.line} : ` : ''}
                {e.message}
              </Text>
            ))}
            {parseErrors.length > 5 && <Text size="sm">…et {parseErrors.length - 5} autre(s) erreur(s).</Text>}
          </Stack>
        </Alert>
      )}

      {rows.length > 0 && (
        <Alert color="emerald" icon={<IconCheck size={16} />}>
          {rows.length} produit{rows.length > 1 ? 's' : ''} prêt{rows.length > 1 ? 's' : ''} à être importé{rows.length > 1 ? 's' : ''}.
        </Alert>
      )}

      {isImporting && <Progress value={progress} animated />}

      {importedCount > 0 && !isImporting && (
        <Alert color="emerald" icon={<IconCheck size={16} />}>
          {importedCount} produit{importedCount > 1 ? 's' : ''} importé{importedCount > 1 ? 's' : ''} avec succès.
        </Alert>
      )}

      {importErrors.length > 0 && !isImporting && (
        <Alert color="red" icon={<IconX size={16} />}>
          <Stack gap={4}>
            {importErrors.map((msg, i) => (
              <Text size="sm" key={i}>
                {msg}
              </Text>
            ))}
          </Stack>
        </Alert>
      )}

      {rows.length > 0 && (
        <Button onClick={handleImport} loading={isImporting}>
          Importer {rows.length} produit{rows.length > 1 ? 's' : ''}
        </Button>
      )}
    </Stack>
  );
}

export function ProductsStepPage() {
  const navigate = useNavigate();
  const updateOrganization = useUpdateOrganization();
  const { data: products = [] } = useProducts();
  const [mode, setMode] = useState<Mode>('choose');
  const [productModalOpened, { open: openProductModal, close: closeProductModal }] = useDisclosure(false);

  async function goToNextStep() {
    try {
      await updateOrganization.mutateAsync({ onboardingStep: 'team' });
    } catch {
      // Non bloquant : même si la sauvegarde de progression échoue, l'utilisateur ne doit jamais être coincé ici.
    }
    navigate('/onboarding/team');
  }

  return (
    <OnboardingShell
      currentStepKey="products"
      icon={IconPackage}
      title="Ajoutez vos produits"
      subtitle="Commencez avec quelques produits ou importez votre catalogue complet."
    >
      <Stack gap="lg">
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <OptionCard
            icon={IconFileSpreadsheet}
            title="Importer un fichier"
            description="CSV / Excel"
            active={mode === 'import'}
            onClick={() => setMode('import')}
          />
          <OptionCard
            icon={IconPlus}
            title="Ajouter manuellement"
            description="Un produit à la fois"
            active={mode === 'manual'}
            onClick={() => {
              setMode('manual');
              openProductModal();
            }}
          />
          <OptionCard
            icon={IconClock}
            title="Je ferai cela plus tard"
            description="Passer cette étape"
            onClick={goToNextStep}
          />
        </SimpleGrid>

        {mode === 'import' && <ImportPanel />}

        {mode === 'manual' && (
          <Group>
            <Button variant="light" leftSection={<IconPlus size={16} />} onClick={openProductModal}>
              Ajouter un autre produit
            </Button>
          </Group>
        )}

        {products.length > 0 && (
          <Group gap="xs">
            <Badge color="emerald" variant="light" leftSection={<IconPackage size={12} />}>
              {products.length} produit{products.length > 1 ? 's' : ''} dans votre catalogue
            </Badge>
          </Group>
        )}

        {mode !== 'choose' && (
          <Button onClick={goToNextStep} loading={updateOrganization.isPending} fullWidth>
            Continuer
          </Button>
        )}
      </Stack>

      <ProductFormModal opened={productModalOpened} onClose={closeProductModal} />
    </OnboardingShell>
  );
}
