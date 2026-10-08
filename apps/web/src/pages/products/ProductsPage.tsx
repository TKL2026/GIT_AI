import type { ProductDto } from '@copilote/shared';
import { Badge, Button, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronRight, IconPlus } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { hasRole, STOCK_MUTATION_ROLES } from '../../auth/roles';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { SearchInput } from '../../components/SearchInput';
import { useProducts } from '../../hooks/useProducts';
import { formatCurrency } from '../../lib/format';
import { STOCK_STATUS_COLORS, STOCK_STATUS_LABELS } from '../../lib/labels';
import { ProductFormModal } from './ProductFormModal';

export function ProductsPage() {
  const { data: products = [], isLoading } = useProducts();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [search, setSearch] = useState('');

  const canManage = hasRole(user, STOCK_MUTATION_ROLES);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query),
    );
  }, [products, search]);

  const columns: DataTableColumn<ProductDto>[] = [
    { key: 'name', label: 'Produit', render: (p) => p.name, sortValue: (p) => p.name.toLowerCase() },
    { key: 'sku', label: 'SKU', render: (p) => p.sku, sortValue: (p) => p.sku.toLowerCase() },
    {
      key: 'purchasePrice',
      label: "Prix d'achat",
      textAlign: 'right',
      render: (p) => formatCurrency(p.purchasePrice),
      sortValue: (p) => p.purchasePrice,
    },
    {
      key: 'salePrice',
      label: 'Prix de vente',
      textAlign: 'right',
      render: (p) => formatCurrency(p.salePrice),
      sortValue: (p) => p.salePrice,
    },
    {
      key: 'margin',
      label: 'Marge',
      textAlign: 'right',
      render: (p) => (
        <Text c={p.salePrice - p.purchasePrice >= 0 ? 'emerald.7' : 'error.7'} fw={600} size="sm">
          {formatCurrency(p.salePrice - p.purchasePrice)}
        </Text>
      ),
      sortValue: (p) => p.salePrice - p.purchasePrice,
    },
    {
      key: 'stockQuantity',
      label: 'Stock',
      textAlign: 'right',
      render: (p) => p.stockQuantity,
      sortValue: (p) => p.stockQuantity,
    },
    {
      key: 'thresholds',
      label: 'Seuil',
      render: (p) => (
        <Text size="sm" c="dimmed">
          {p.minStock ?? '—'} / {p.maxStock ?? '—'}
        </Text>
      ),
    },
    {
      key: 'stockValue',
      label: 'Valeur stock',
      textAlign: 'right',
      render: (p) => formatCurrency(p.stockQuantity * p.purchasePrice),
      sortValue: (p) => p.stockQuantity * p.purchasePrice,
    },
    {
      key: 'status',
      label: 'État',
      render: (p) => (
        <Badge color={STOCK_STATUS_COLORS[p.stockStatus]} variant="light">
          {STOCK_STATUS_LABELS[p.stockStatus]}
        </Badge>
      ),
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

      <SearchInput
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        placeholder="Rechercher par nom ou SKU…"
        mb="md"
      />

      <DataTable
        columns={columns}
        rows={filteredProducts}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        emptyMessage={
          search.trim()
            ? 'Aucun produit ne correspond à votre recherche.'
            : 'Aucun produit enregistré pour le moment.'
        }
        pageSize={10}
        onRowClick={(p) => navigate(`/products/${p.id}`)}
      />

      <ProductFormModal opened={modalOpened} onClose={closeModal} />
    </>
  );
}
