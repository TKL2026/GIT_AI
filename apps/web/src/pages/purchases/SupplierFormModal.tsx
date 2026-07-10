import { Button, Group, Modal, SimpleGrid, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCreateSupplier } from '../../hooks/useSuppliers';
import { ApiError } from '../../lib/apiClient';

interface SupplierFormModalProps {
  opened: boolean;
  onClose: () => void;
}

interface SupplierFormValues {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
}

export function SupplierFormModal({ opened, onClose }: SupplierFormModalProps) {
  const createSupplier = useCreateSupplier();

  const form = useForm<SupplierFormValues>({
    initialValues: { name: '', contactName: '', phone: '', email: '', address: '' },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Nom requis.'),
      email: (value) => (!value || /^\S+@\S+\.\S+$/.test(value) ? null : 'Email invalide.'),
    },
  });

  async function handleSubmit(values: SupplierFormValues) {
    try {
      await createSupplier.mutateAsync({
        name: values.name,
        contactName: values.contactName || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        address: values.address || undefined,
      });
      notifications.show({ color: 'green', message: 'Fournisseur créé avec succès.' });
      form.reset();
      onClose();
    } catch (err) {
      notifications.show({
        color: 'red',
        message: err instanceof ApiError ? err.message : 'Impossible de créer le fournisseur.',
      });
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Nouveau fournisseur" size="lg">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Nom"
            placeholder="Grossiste Alpha"
            required
            {...form.getInputProps('name')}
          />

          <SimpleGrid cols={2}>
            <TextInput
              label="Contact"
              placeholder="Optionnel"
              {...form.getInputProps('contactName')}
            />
            <TextInput label="Téléphone" placeholder="Optionnel" {...form.getInputProps('phone')} />
          </SimpleGrid>

          <SimpleGrid cols={2}>
            <TextInput label="Email" placeholder="Optionnel" {...form.getInputProps('email')} />
            <TextInput label="Adresse" placeholder="Optionnel" {...form.getInputProps('address')} />
          </SimpleGrid>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" loading={createSupplier.isPending}>
              Créer le fournisseur
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
