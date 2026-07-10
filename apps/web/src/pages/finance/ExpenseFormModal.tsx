import { ExpenseCategory } from '@copilote/shared';
import { Button, Group, Modal, NumberInput, Select, Stack, Textarea } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCreateExpense } from '../../hooks/useExpenses';
import { ApiError } from '../../lib/apiClient';
import { EXPENSE_CATEGORY_LABELS } from '../../lib/labels';

interface ExpenseFormModalProps {
  opened: boolean;
  onClose: () => void;
}

interface ExpenseFormValues {
  category: ExpenseCategory;
  description: string;
  amount: number | '';
  expenseDate: Date | null;
}

export function ExpenseFormModal({ opened, onClose }: ExpenseFormModalProps) {
  const createExpense = useCreateExpense();

  const form = useForm<ExpenseFormValues>({
    initialValues: {
      category: ExpenseCategory.RENT,
      description: '',
      amount: '',
      expenseDate: null,
    },
    validate: {
      category: (value) => (value ? null : 'Catégorie requise.'),
      amount: (value) => (typeof value === 'number' && value > 0 ? null : 'Montant requis.'),
    },
  });

  async function handleSubmit(values: ExpenseFormValues) {
    try {
      await createExpense.mutateAsync({
        category: values.category,
        description: values.description.trim() || undefined,
        amount: Number(values.amount),
        expenseDate: values.expenseDate ? values.expenseDate.toISOString() : undefined,
      });
      notifications.show({ color: 'green', message: 'Dépense enregistrée avec succès.' });
      form.reset();
      onClose();
    } catch (err) {
      notifications.show({
        color: 'red',
        message: err instanceof ApiError ? err.message : "Impossible d'enregistrer la dépense.",
      });
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Nouvelle dépense" size="lg">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Select
            label="Catégorie"
            required
            data={Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            {...form.getInputProps('category')}
          />

          <NumberInput
            label="Montant"
            placeholder="150000"
            min={0}
            required
            {...form.getInputProps('amount')}
          />

          <DatePickerInput
            label="Date"
            placeholder="Aujourd'hui par défaut"
            clearable
            {...form.getInputProps('expenseDate')}
          />

          <Textarea
            label="Description"
            placeholder="Optionnel"
            {...form.getInputProps('description')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" loading={createExpense.isPending}>
              Enregistrer
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
