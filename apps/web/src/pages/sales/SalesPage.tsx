import { PaymentMethod, type SaleDto } from '@copilote/shared';
import { Badge, Button, Group, Select } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronRight, IconPlus } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { hasRole, SALES_MUTATION_ROLES } from '../../auth/roles';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { SearchInput } from '../../components/SearchInput';
import { useSales } from '../../hooks/useSales';
import { formatCurrency, formatDate } from '../../lib/format';
import { PAYMENT_METHOD_LABELS } from '../../lib/labels';
import { SaleFormModal } from './SaleFormModal';

const PAYMENT_METHOD_OPTIONS = Object.values(PaymentMethod).map((value) => ({
  value,
  label: PAYMENT_METHOD_LABELS[value],
}));

export function SalesPage() {
  const { data: sales = [], isLoading } = useSales();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  const canManage = hasRole(user, SALES_MUTATION_ROLES);

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sales.filter((s) => {
      if (query && !(s.customerName ?? 'anonyme').toLowerCase().includes(query)) return false;
      if (paymentMethod && s.paymentMethod !== paymentMethod) return false;
      const createdAt = new Date(s.createdAt);
      if (fromDate && createdAt < fromDate) return false;
      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (createdAt > endOfDay) return false;
      }
      return true;
    });
  }, [sales, search, paymentMethod, fromDate, toDate]);

  const columns: DataTableColumn<SaleDto>[] = [
    {
      key: 'createdAt',
      label: 'Date',
      render: (s) => formatDate(s.createdAt),
      sortValue: (s) => new Date(s.createdAt).getTime(),
    },
    {
      key: 'customerName',
      label: 'Client',
      render: (s) => s.customerName ?? 'Anonyme',
      sortValue: (s) => (s.customerName ?? 'Anonyme').toLowerCase(),
    },
    {
      key: 'paymentMethod',
      label: 'Paiement',
      render: (s) => <Badge variant="light">{PAYMENT_METHOD_LABELS[s.paymentMethod]}</Badge>,
    },
    { key: 'items', label: 'Articles', textAlign: 'right', render: (s) => s.items.length },
    {
      key: 'totalAmount',
      label: 'Total',
      textAlign: 'right',
      render: (s) => formatCurrency(s.totalAmount),
      sortValue: (s) => s.totalAmount,
    },
    {
      key: 'actions',
      label: '',
      textAlign: 'right',
      render: () => <IconChevronRight size={16} color="var(--mantine-color-dimmed)" />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Ventes"
        description="Enregistrement des ventes et historique"
        action={
          canManage && (
            <Button leftSection={<IconPlus size={16} />} onClick={openModal}>
              Nouvelle vente
            </Button>
          )
        }
      />

      <Group mb="md" align="flex-end">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          placeholder="Rechercher par client…"
        />
        <DatePickerInput label="Du" placeholder="Toutes dates" value={fromDate} onChange={setFromDate} clearable />
        <DatePickerInput label="Au" placeholder="Toutes dates" value={toDate} onChange={setToDate} clearable />
        <Select
          label="Paiement"
          placeholder="Tous"
          data={PAYMENT_METHOD_OPTIONS}
          value={paymentMethod}
          onChange={setPaymentMethod}
          clearable
          w={160}
        />
      </Group>

      <DataTable
        columns={columns}
        rows={filteredSales}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        emptyMessage="Aucune vente enregistrée pour le moment."
        pageSize={10}
        onRowClick={(s) => navigate(`/sales/${s.id}`)}
      />

      <SaleFormModal opened={modalOpened} onClose={closeModal} />
    </>
  );
}
