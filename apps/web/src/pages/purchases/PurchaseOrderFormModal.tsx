import {
  ActionIcon,
  Button,
  Divider,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useProducts } from '../../hooks/useProducts';
import { useCreatePurchaseOrder } from '../../hooks/usePurchases';
import { useSuppliers } from '../../hooks/useSuppliers';
import { ApiError } from '../../lib/apiClient';
import { formatCurrency } from '../../lib/format';

interface PurchaseOrderFormModalProps {
  opened: boolean;
  onClose: () => void;
}

interface PurchaseOrderLineFormValues {
  productId: string;
  quantity: number | '';
  unitCost: number | '';
}

interface PurchaseOrderFormValues {
  supplierId: string;
  items: PurchaseOrderLineFormValues[];
}

export function PurchaseOrderFormModal({ opened, onClose }: PurchaseOrderFormModalProps) {
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();
  const createPurchaseOrder = useCreatePurchaseOrder();

  const form = useForm<PurchaseOrderFormValues>({
    initialValues: {
      supplierId: '',
      items: [{ productId: '', quantity: 1, unitCost: '' }],
    },
    validate: {
      supplierId: (value) => (value ? null : 'Fournisseur requis.'),
      items: (value) => {
        if (!value || value.length === 0) return 'Ajoutez au moins une ligne.';
        for (const item of value) {
          if (!item.productId) return 'Chaque ligne doit avoir un produit.';
          if (!item.quantity || Number(item.quantity) <= 0) return 'Quantité invalide.';
          if (!item.unitCost || Number(item.unitCost) <= 0) return 'Coût unitaire invalide.';
        }
        return null;
      },
    },
  });

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.name }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }));

  const estimatedTotal = form.values.items.reduce((sum, item) => {
    if (!item.quantity || !item.unitCost) return sum;
    return sum + Number(item.quantity) * Number(item.unitCost);
  }, 0);

  async function handleSubmit(values: PurchaseOrderFormValues) {
    try {
      await createPurchaseOrder.mutateAsync({
        supplierId: values.supplierId,
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        })),
      });
      notifications.show({ color: 'green', message: 'Commande créée avec succès.' });
      form.reset();
      onClose();
    } catch (err) {
      notifications.show({
        color: 'red',
        message: err instanceof ApiError ? err.message : 'Impossible de créer la commande.',
      });
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Nouvelle commande fournisseur" size="xl">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Select
            label="Fournisseur"
            placeholder="Sélectionner un fournisseur"
            required
            data={supplierOptions}
            searchable
            {...form.getInputProps('supplierId')}
          />

          <Divider label="Articles" labelPosition="left" />

          <Stack gap="xs">
            {form.values.items.map((_, index) => (
              <Group key={index} align="flex-end" wrap="nowrap">
                <Select
                  label={index === 0 ? 'Produit' : undefined}
                  placeholder="Sélectionner un produit"
                  data={productOptions}
                  searchable
                  style={{ flex: 3 }}
                  {...form.getInputProps(`items.${index}.productId`)}
                />
                <NumberInput
                  label={index === 0 ? 'Quantité' : undefined}
                  min={1}
                  style={{ flex: 1 }}
                  {...form.getInputProps(`items.${index}.quantity`)}
                />
                <NumberInput
                  label={index === 0 ? 'Coût unitaire' : undefined}
                  min={0}
                  style={{ flex: 1 }}
                  {...form.getInputProps(`items.${index}.unitCost`)}
                />
                <ActionIcon
                  color="red"
                  variant="subtle"
                  onClick={() => form.removeListItem('items', index)}
                  disabled={form.values.items.length === 1}
                  mb={4}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            ))}

            {form.errors.items && (
              <Text c="red" size="sm">
                {form.errors.items}
              </Text>
            )}

            <Button
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={() =>
                form.insertListItem('items', { productId: '', quantity: 1, unitCost: '' })
              }
            >
              Ajouter une ligne
            </Button>
          </Stack>

          <Divider />

          <Group justify="space-between">
            <Text fw={600}>Total estimé</Text>
            <Text fw={600} size="lg">
              {formatCurrency(estimatedTotal)}
            </Text>
          </Group>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" loading={createPurchaseOrder.isPending}>
              Créer la commande
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
