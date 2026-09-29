import type { PurchaseOrderDto, PurchaseRecommendationDto, SupplierDto } from '@copilote/shared';
import { Badge, Button, Tabs, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBuildingWarehouse,
  IconBulb,
  IconChevronRight,
  IconPackageImport,
  IconPlus,
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { hasRole, STOCK_MUTATION_ROLES, SUPPLIER_MUTATION_ROLES } from '../../auth/roles';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { SearchInput } from '../../components/SearchInput';
import { usePurchaseRecommendations } from '../../hooks/usePurchasing';
import { usePurchaseOrders } from '../../hooks/usePurchases';
import { useSuppliers } from '../../hooks/useSuppliers';
import { formatCurrency, formatDate } from '../../lib/format';
import { PURCHASE_ORDER_STATUS_COLORS, PURCHASE_ORDER_STATUS_LABELS } from '../../lib/labels';
import { PurchaseOrderFormModal } from './PurchaseOrderFormModal';
import { SupplierFormModal } from './SupplierFormModal';

export function PurchasesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: orders = [], isLoading: isLoadingOrders } = usePurchaseOrders();
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();
  const { data: recommendations = [], isLoading: isLoadingRecommendations } = usePurchaseRecommendations();

  const [orderModalOpened, { open: openOrderModal, close: closeOrderModal }] = useDisclosure(false);
  const [supplierModalOpened, { open: openSupplierModal, close: closeSupplierModal }] =
    useDisclosure(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');

  const canManageOrders = hasRole(user, STOCK_MUTATION_ROLES);
  const canManageSuppliers = hasRole(user, SUPPLIER_MUTATION_ROLES);

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((o) => o.supplierName.toLowerCase().includes(query));
  }, [orders, orderSearch]);

  const filteredSuppliers = useMemo(() => {
    const query = supplierSearch.trim().toLowerCase();
    if (!query) return suppliers;
    return suppliers.filter((s) => s.name.toLowerCase().includes(query));
  }, [suppliers, supplierSearch]);

  const orderColumns: DataTableColumn<PurchaseOrderDto>[] = [
    {
      key: 'createdAt',
      label: 'Date',
      render: (o) => formatDate(o.createdAt),
      sortValue: (o) => new Date(o.createdAt).getTime(),
    },
    {
      key: 'supplierName',
      label: 'Fournisseur',
      render: (o) => o.supplierName,
      sortValue: (o) => o.supplierName.toLowerCase(),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (o) => (
        <Badge color={PURCHASE_ORDER_STATUS_COLORS[o.status]} variant="light">
          {PURCHASE_ORDER_STATUS_LABELS[o.status]}
        </Badge>
      ),
    },
    { key: 'items', label: 'Articles', textAlign: 'right', render: (o) => o.items.length },
    {
      key: 'totalAmount',
      label: 'Total',
      textAlign: 'right',
      render: (o) => formatCurrency(o.totalAmount),
      sortValue: (o) => o.totalAmount,
    },
    {
      key: 'actions',
      label: '',
      textAlign: 'right',
      render: () => <IconChevronRight size={16} color="var(--mantine-color-dimmed)" />,
    },
  ];

  const supplierColumns: DataTableColumn<SupplierDto>[] = [
    { key: 'name', label: 'Nom', render: (s) => s.name, sortValue: (s) => s.name.toLowerCase() },
    { key: 'contactName', label: 'Contact', render: (s) => s.contactName ?? '—' },
    { key: 'phone', label: 'Téléphone', render: (s) => s.phone ?? '—' },
    {
      key: 'email',
      label: 'Email',
      render: (s) => (
        <Text size="sm" c="dimmed">
          {s.email ?? '—'}
        </Text>
      ),
    },
  ];

  const recommendationColumns: DataTableColumn<PurchaseRecommendationDto>[] = [
    { key: 'productName', label: 'Produit', render: (r) => r.productName },
    {
      key: 'recommendedQuantity',
      label: 'Qté recommandée',
      textAlign: 'right',
      render: (r) => r.recommendedQuantity,
      sortValue: (r) => r.recommendedQuantity,
    },
    {
      key: 'daysUntilStockout',
      label: 'Jours avant rupture',
      textAlign: 'right',
      render: (r) =>
        r.daysUntilStockout === null ? (
          <Text size="sm" c="dimmed">—</Text>
        ) : (
          <Badge color={r.daysUntilStockout < 7 ? 'error' : r.daysUntilStockout < 14 ? 'warning' : 'emerald'} variant="light">
            {r.daysUntilStockout} j
          </Badge>
        ),
      sortValue: (r) => r.daysUntilStockout ?? Number.MAX_SAFE_INTEGER,
    },
    {
      key: 'recommendedSupplierName',
      label: 'Fournisseur recommandé',
      render: (r) =>
        r.hasSupplierHistory ? (
          r.recommendedSupplierName
        ) : (
          <Badge color="gray" variant="light">À sourcer</Badge>
        ),
    },
    {
      key: 'lastUnitCost',
      label: 'Dernier coût unitaire',
      textAlign: 'right',
      render: (r) => (r.lastUnitCost === null ? '—' : formatCurrency(r.lastUnitCost)),
    },
  ];

  return (
    <>
      <PageHeader title="Achats" description="Fournisseurs et commandes d'approvisionnement" />

      <Tabs defaultValue="orders">
        <Tabs.List>
          <Tabs.Tab value="orders" leftSection={<IconPackageImport size={16} />}>
            Commandes
          </Tabs.Tab>
          <Tabs.Tab value="suppliers" leftSection={<IconBuildingWarehouse size={16} />}>
            Fournisseurs
          </Tabs.Tab>
          <Tabs.Tab value="recommendations" leftSection={<IconBulb size={16} />}>
            Recommandations
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="orders" pt="md">
          {canManageOrders && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={openOrderModal}
              mb="md"
              disabled={suppliers.length === 0}
            >
              Nouvelle commande
            </Button>
          )}
          {canManageOrders && suppliers.length === 0 && (
            <Text size="sm" c="dimmed" mb="md">
              Créez d'abord un fournisseur pour pouvoir enregistrer une commande.
            </Text>
          )}
          <SearchInput
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.currentTarget.value)}
            placeholder="Rechercher par fournisseur…"
            mb="md"
          />
          <DataTable
            columns={orderColumns}
            rows={filteredOrders}
            rowKey={(o) => o.id}
            isLoading={isLoadingOrders}
            emptyMessage="Aucune commande enregistrée pour le moment."
            pageSize={10}
            onRowClick={(o) => navigate(`/purchases/${o.id}`)}
          />
        </Tabs.Panel>

        <Tabs.Panel value="suppliers" pt="md">
          {canManageSuppliers && (
            <Button leftSection={<IconPlus size={16} />} onClick={openSupplierModal} mb="md">
              Nouveau fournisseur
            </Button>
          )}
          <SearchInput
            value={supplierSearch}
            onChange={(e) => setSupplierSearch(e.currentTarget.value)}
            placeholder="Rechercher par nom…"
            mb="md"
          />
          <DataTable
            columns={supplierColumns}
            rows={filteredSuppliers}
            rowKey={(s) => s.id}
            isLoading={isLoadingSuppliers}
            emptyMessage="Aucun fournisseur enregistré pour le moment."
            pageSize={10}
          />
        </Tabs.Panel>

        <Tabs.Panel value="recommendations" pt="md">
          <Text size="sm" c="dimmed" mb="sm">
            Calculé à partir de la prévision de réapprovisionnement et de l'historique des commandes
            fournisseurs. Le fournisseur suggéré est le moins cher parmi ceux ayant déjà fourni ce produit.
          </Text>
          <DataTable
            columns={recommendationColumns}
            rows={recommendations}
            rowKey={(r) => r.productId}
            isLoading={isLoadingRecommendations}
            emptyMessage="Rien à commander pour le moment."
            pageSize={10}
          />
        </Tabs.Panel>
      </Tabs>

      <PurchaseOrderFormModal opened={orderModalOpened} onClose={closeOrderModal} />
      <SupplierFormModal opened={supplierModalOpened} onClose={closeSupplierModal} />
    </>
  );
}
