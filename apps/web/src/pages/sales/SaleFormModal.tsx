import { PaymentMethod } from '@copilote/shared';
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
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useCreateSale } from '../../hooks/useSales';
import { useProducts } from '../../hooks/useProducts';
import { ApiError } from '../../lib/apiClient';
import { formatCurrency } from '../../lib/format';
import { PAYMENT_METHOD_LABELS } from '../../lib/labels';

interface SaleFormModalProps {
  opened: boolean;
  onClose: () => void;
}

interface SaleLineFormValues {
  productId: string;
  quantity: number | '';
}

interface SaleFormValues {
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  items: SaleLineFormValues[];
}

export function SaleFormModal({ opened, onClose }: SaleFormModalProps) {
  const { data: products = [] } = useProducts();
  const createSale = useCreateSale();

  const form = useForm<SaleFormValues>({
    initialValues: {
      customerName: '',
      customerPhone: '',
      paymentMethod: PaymentMethod.CASH,
      items: [{ productId: '', quantity: 1 }],
    },
    validate: {
      paymentMethod: (value) => (value ? null : 'Moyen de paiement requis.'),
      items: (value) => {
        if (!value || value.length === 0) return 'Ajoutez au moins une ligne.';
        for (const item of value) {
          if (!item.productId) return 'Chaque ligne doit avoir un produit.';
          if (!item.quantity || Number(item.quantity) <= 0) return 'Quantité invalide.';
        }
        return null;
      },
    },
  });

  const productOptions = products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }));

  const estimatedTotal = form.values.items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product || !item.quantity) return sum;
    return sum + product.salePrice * Number(item.quantity);
  }, 0);

  async function handleSubmit(values: SaleFormValues) {
    try {
      await createSale.mutateAsync({
        customerName: values.customerName.trim() || undefined,
        customerPhone: values.customerPhone.trim() || undefined,
        paymentMethod: values.paymentMethod,
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
        })),
      });
      notifications.show({ color: 'green', message: 'Vente enregistrée avec succès.' });
      form.reset();
      onClose();
    } catch (err) {
      notifications.show({
        color: 'red',
        message: err instanceof ApiError ? err.message : "Impossible d'enregistrer la vente.",
      });
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Nouvelle vente" size="xl">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Group grow>
            <TextInput
              label="Client"
              placeholder="Optionnel"
              {...form.getInputProps('customerName')}
            />
            <TextInput
              label="Téléphone client"
              placeholder="Optionnel"
              {...form.getInputProps('customerPhone')}
            />
            <Select
              label="Moyen de paiement"
              required
              data={Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              {...form.getInputProps('paymentMethod')}
            />
          </Group>

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
              onClick={() => form.insertListItem('items', { productId: '', quantity: 1 })}
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
            <Button type="submit" loading={createSale.isPending}>
              Enregistrer la vente
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
