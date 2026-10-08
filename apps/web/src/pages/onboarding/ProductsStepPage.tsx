import { Badge, Button, Card, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconClock, IconFileSpreadsheet, IconPackage, IconPlus, type Icon } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImportWizard } from '../../import/ImportWizard';
import { PRODUCT_IMPORT_FIELDS } from '../../import/importFieldDefinitions';
import { ProductFormModal } from '../products/ProductFormModal';
import { useImportProducts, useProducts } from '../../hooks/useProducts';
import { useUpdateOrganization } from '../../hooks/useOrganization';
import { OnboardingShell } from '../../onboarding/OnboardingShell';

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

function ProductsImportPanel({ onFinished }: { onFinished: () => void }) {
  const importProducts = useImportProducts();

  return (
    <ImportWizard
      fields={PRODUCT_IMPORT_FIELDS}
      entityLabelSingular="produit"
      entityLabelPlural="produits"
      onImport={(rows) => importProducts.mutateAsync(rows)}
      onFinished={onFinished}
    />
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

        {mode === 'import' && <ProductsImportPanel onFinished={() => {}} />}

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
