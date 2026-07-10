import type { ProductDto } from '@copilote/shared';
import { Badge, Button, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { useAuth } from '../../auth/AuthContext';
import { hasRole, STOCK_MUTATION_ROLES } from '../../auth/roles';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { useProducts } from '../../hooks/useProducts';
import { formatCurrency } from '../../lib/format';
import { ProductFormModal } from './ProductFormModal';

export function ProductsPage() {
  const { data: products = [], isLoading } = useProducts();
  const { user } = useAuth();
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const canManage = hasRole(user, STOCK_MUTATION_ROLES);

  const columns: DataTableColumn<ProductDto>[] = [
    { key: 'name', label: 'Nom', render: (p) => p.name },
    { key: 'sku', label: 'SKU', render: (p) => p.sku },
    {
      key: 'purchasePrice',
      label: "Prix d'achat",
      textAlign: 'right',
      render: (p) => formatCurrency(p.purchasePrice),
    },
    {
      key: 'salePrice',
      label: 'Prix de vente',
      textAlign: 'right',
      render: (p) => formatCurrency(p.salePrice),
    },
    {
      key: 'stockQuantity',
      label: 'Stock',
      textAlign: 'right',
      render: (p) => {
        const isLow = p.minStock !== null && p.stockQuantity <= p.minStock;
        return (
          <Badge color={isLow ? 'red' : 'gray'} variant={isLow ? 'filled' : 'light'}>
            {p.stockQuantity}
          </Badge>
        );
      },
    },
    {
      key: 'thresholds',
      label: 'Seuils',
      render: (p) => (
        <Text size="sm" c="dimmed">
          {p.minStock ?? '—'} / {p.maxStock ?? '—'}
        </Text>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Produits"
        description="Catalogue, prix et seuils de stock"
        action={
          canManage && (
            <Button leftSection={<IconPlus size={16} />} onClick={openModal}>
              Nouveau produit
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        rows={products}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        emptyMessage="Aucun produit enregistré pour le moment."
      />

      <ProductFormModal opened={modalOpened} onClose={closeModal} />
    </>
  );
}
