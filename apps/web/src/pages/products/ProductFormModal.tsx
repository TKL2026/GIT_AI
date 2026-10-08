import type { ProductDto } from '@copilote/shared';
import { Button, Group, Modal, NumberInput, SimpleGrid, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';
import { ApiError } from '../../lib/apiClient';

interface ProductFormModalProps {
  opened: boolean;
  onClose: () => void;
  /** Présent = mode édition (PATCH), absent = création (POST). */
  product?: ProductDto;
}

interface ProductFormValues {
  name: string;
  sku: string;
  purchasePrice: number | '';
  salePrice: number | '';
  initialStock: number | '';
  minStock: number | '';
  maxStock: number | '';
}

export function ProductFormModal({ opened, onClose, product }: ProductFormModalProps) {
  const isEditing = Boolean(product);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isPending = createProduct.isPending || updateProduct.isPending;

  const form = useForm<ProductFormValues>({
    initialValues: {
      name: '',
      sku: '',
      purchasePrice: '',
      salePrice: '',
      initialStock: 0,
      minStock: '',
      maxStock: '',
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Nom requis.'),
      sku: (value) => (value.trim().length > 0 ? null : 'SKU requis.'),
      purchasePrice: (value) =>
        typeof value === 'number' && value > 0 ? null : 'Prix d\'achat requis.',
      salePrice: (value) =>
        typeof value === 'number' && value > 0 ? null : 'Prix de vente requis.',
    },
  });

  useEffect(() => {
    if (opened && product) {
      form.setValues({
        name: product.name,
        sku: product.sku,
        purchasePrice: product.purchasePrice,
        salePrice: product.salePrice,
        initialStock: 0,
        minStock: product.minStock ?? '',
        maxStock: product.maxStock ?? '',
      });
    } else if (opened && !product) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, product]);

  async function handleSubmit(values: ProductFormValues) {
    try {
      if (isEditing && product) {
        await updateProduct.mutateAsync({
          id: product.id,
          input: {
            name: values.name,
            sku: values.sku,
            purchasePrice: Number(values.purchasePrice),
            salePrice: Number(values.salePrice),
            minStock: values.minStock === '' ? undefined : Number(values.minStock),
            maxStock: values.maxStock === '' ? undefined : Number(values.maxStock),
          },
        });
        notifications.show({ color: 'green', message: 'Produit modifié avec succès.' });
      } else {
        await createProduct.mutateAsync({
          name: values.name,
          sku: values.sku,
          purchasePrice: Number(values.purchasePrice),
          salePrice: Number(values.salePrice),
          initialStock: values.initialStock === '' ? undefined : Number(values.initialStock),
          minStock: values.minStock === '' ? undefined : Number(values.minStock),
          maxStock: values.maxStock === '' ? undefined : Number(values.maxStock),
        });
        notifications.show({ color: 'green', message: 'Produit créé avec succès.' });
      }
      form.reset();
      onClose();
    } catch (err) {
      notifications.show({
        color: 'red',
        message:
          err instanceof ApiError
            ? err.message
            : `Impossible de ${isEditing ? 'modifier' : 'créer'} le produit.`,
      });
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={isEditing ? 'Modifier le produit' : 'Nouveau produit'} size="lg">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <SimpleGrid cols={2}>
            <TextInput label="Nom" placeholder="Riz 25kg" required {...form.getInputProps('name')} />
            <TextInput label="SKU" placeholder="RIZ-25KG" required {...form.getInputProps('sku')} />
          </SimpleGrid>

          <SimpleGrid cols={2}>
            <NumberInput
              label="Prix d'achat"
              placeholder="12000"
              min={0}
              required
              {...form.getInputProps('purchasePrice')}
            />
            <NumberInput
              label="Prix de vente"
              placeholder="15000"
              min={0}
              required
              {...form.getInputProps('salePrice')}
            />
          </SimpleGrid>

          {!isEditing && (
            <NumberInput
              label="Stock initial"
              min={0}
              {...form.getInputProps('initialStock')}
            />
          )}

          <SimpleGrid cols={2}>
            <NumberInput
              label="Seuil minimum"
              description="Déclenche une alerte de rupture"
              min={0}
              {...form.getInputProps('minStock')}
            />
            <NumberInput label="Seuil maximum" min={0} {...form.getInputProps('maxStock')} />
          </SimpleGrid>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" loading={isPending}>
              {isEditing ? 'Enregistrer' : 'Créer le produit'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
