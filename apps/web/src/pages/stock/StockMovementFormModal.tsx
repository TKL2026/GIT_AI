import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  SegmentedControl,
  Stack,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useProducts } from '../../hooks/useProducts';
import {
  useRecordStockAdjustment,
  useRecordStockIn,
  useRecordStockOut,
} from '../../hooks/useStock';
import { ApiError } from '../../lib/apiClient';

interface StockMovementFormModalProps {
  opened: boolean;
  onClose: () => void;
}

type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

interface StockMovementFormValues {
  type: MovementType;
  productId: string;
  quantity: number | '';
  newQuantity: number | '';
  reason: string;
}

export function StockMovementFormModal({ opened, onClose }: StockMovementFormModalProps) {
  const { data: products = [] } = useProducts();
  const recordIn = useRecordStockIn();
  const recordOut = useRecordStockOut();
  const recordAdjustment = useRecordStockAdjustment();

  const isSubmitting = recordIn.isPending || recordOut.isPending || recordAdjustment.isPending;

  const form = useForm<StockMovementFormValues>({
    initialValues: {
      type: 'IN',
      productId: '',
      quantity: '',
      newQuantity: '',
      reason: '',
    },
    validate: {
      productId: (value) => (value ? null : 'Produit requis.'),
      quantity: (value, values) =>
        values.type !== 'ADJUSTMENT' && (typeof value !== 'number' || value <= 0)
          ? 'Quantité requise.'
          : null,
      newQuantity: (value, values) =>
        values.type === 'ADJUSTMENT' && (typeof value !== 'number' || value < 0)
          ? 'Nouvelle quantité requise.'
          : null,
      reason: (value, values) =>
        values.type === 'ADJUSTMENT' && value.trim().length < 3
          ? 'Motif requis pour un ajustement.'
          : null,
    },
  });

  async function handleSubmit(values: StockMovementFormValues) {
    try {
      if (values.type === 'IN') {
        await recordIn.mutateAsync({
          productId: values.productId,
          quantity: Number(values.quantity),
          reason: values.reason || undefined,
        });
      } else if (values.type === 'OUT') {
        await recordOut.mutateAsync({
          productId: values.productId,
          quantity: Number(values.quantity),
          reason: values.reason || undefined,
        });
      } else {
        await recordAdjustment.mutateAsync({
          productId: values.productId,
          newQuantity: Number(values.newQuantity),
          reason: values.reason,
        });
      }
      notifications.show({ color: 'green', message: 'Mouvement de stock enregistré.' });
      form.reset();
      onClose();
    } catch (err) {
      notifications.show({
        color: 'red',
        message: err instanceof ApiError ? err.message : "Impossible d'enregistrer le mouvement.",
      });
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Enregistrer un mouvement de stock" size="lg">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <SegmentedControl
            fullWidth
            data={[
              { label: 'Entrée', value: 'IN' },
              { label: 'Sortie', value: 'OUT' },
              { label: 'Ajustement', value: 'ADJUSTMENT' },
            ]}
            {...form.getInputProps('type')}
          />

          <Select
            label="Produit"
            placeholder="Sélectionner un produit"
            required
            data={products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
            searchable
            {...form.getInputProps('productId')}
          />

          {form.values.type === 'ADJUSTMENT' ? (
            <NumberInput
              label="Nouvelle quantité constatée"
              min={0}
              required
              {...form.getInputProps('newQuantity')}
            />
          ) : (
            <NumberInput
              label="Quantité"
              min={1}
              required
              {...form.getInputProps('quantity')}
            />
          )}

          <Textarea
            label="Motif"
            placeholder={
              form.values.type === 'ADJUSTMENT'
                ? "Écart constaté lors de l'inventaire..."
                : 'Optionnel'
            }
            required={form.values.type === 'ADJUSTMENT'}
            {...form.getInputProps('reason')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Enregistrer
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
