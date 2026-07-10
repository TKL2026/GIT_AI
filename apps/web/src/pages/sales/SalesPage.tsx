import type { SaleDto } from '@copilote/shared';
import { Badge, Button, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { hasRole, SALES_MUTATION_ROLES } from '../../auth/roles';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { useSales } from '../../hooks/useSales';
import { formatCurrency, formatDate } from '../../lib/format';
import { PAYMENT_METHOD_LABELS } from '../../lib/labels';
import { SaleDetailModal } from './SaleDetailModal';
import { SaleFormModal } from './SaleFormModal';

export function SalesPage() {
  const { data: sales = [], isLoading } = useSales();
  const { user } = useAuth();
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [selectedSale, setSelectedSale] = useState<SaleDto | null>(null);

  const canManage = hasRole(user, SALES_MUTATION_ROLES);

  const columns: DataTableColumn<SaleDto>[] = [
    { key: 'createdAt', label: 'Date', render: (s) => formatDate(s.createdAt) },
    { key: 'customerName', label: 'Client', render: (s) => s.customerName ?? 'Anonyme' },
    {
      key: 'paymentMethod',
      label: 'Paiement',
      render: (s) => (
        <Badge variant="light">{PAYMENT_METHOD_LABELS[s.paymentMethod]}</Badge>
      ),
    },
    {
      key: 'items',
      label: 'Articles',
      textAlign: 'right',
      render: (s) => s.items.length,
    },
    {
      key: 'totalAmount',
      label: 'Total',
      textAlign: 'right',
      render: (s) => formatCurrency(s.totalAmount),
    },
    {
      key: 'actions',
      label: '',
      render: (s) => (
        <UnstyledButton onClick={() => setSelectedSale(s)}>
          <Text size="sm" c="indigo">
            Voir
          </Text>
        </UnstyledButton>
      ),
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

      <DataTable
        columns={columns}
        rows={sales}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        emptyMessage="Aucune vente enregistrée pour le moment."
      />

      <SaleFormModal opened={modalOpened} onClose={closeModal} />
      <SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} />
    </>
  );
}
