import type { PurchaseOrderDto, SupplierDto } from '@copilote/shared';
import { Badge, Button, Menu, Tabs, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconBuildingWarehouse,
  IconDotsVertical,
  IconPackageImport,
  IconPlus,
  IconShoppingCartCancel,
  IconTruckDelivery,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { hasRole, STOCK_MUTATION_ROLES, SUPPLIER_MUTATION_ROLES } from '../../auth/roles';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { useCancelPurchaseOrder, usePurchaseOrders, useReceivePurchaseOrder } from '../../hooks/usePurchases';
import { useSuppliers } from '../../hooks/useSuppliers';
import { ApiError } from '../../lib/apiClient';
import { formatCurrency, formatDate } from '../../lib/format';
import { PURCHASE_ORDER_STATUS_COLORS, PURCHASE_ORDER_STATUS_LABELS } from '../../lib/labels';
import { PurchaseOrderDetailModal } from './PurchaseOrderDetailModal';
import { PurchaseOrderFormModal } from './PurchaseOrderFormModal';
import { SupplierFormModal } from './SupplierFormModal';

export function PurchasesPage() {
  const { user } = useAuth();
  const { data: orders = [], isLoading: isLoadingOrders } = usePurchaseOrders();
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();
  const receiveOrder = useReceivePurchaseOrder();
  const cancelOrder = useCancelPurchaseOrder();

  const [orderModalOpened, { open: openOrderModal, close: closeOrderModal }] = useDisclosure(false);
  const [supplierModalOpened, { open: openSupplierModal, close: closeSupplierModal }] =
    useDisclosure(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderDto | null>(null);

  const canManageOrders = hasRole(user, STOCK_MUTATION_ROLES);
  const canManageSuppliers = hasRole(user, SUPPLIER_MUTATION_ROLES);

  async function handleReceive(id: string) {
    try {
      await receiveOrder.mutateAsync(id);
      notifications.show({ color: 'green', message: 'Commande réceptionnée, stock mis à jour.' });
    } catch (err) {
      notifications.show({
        color: 'red',
        message: err instanceof ApiError ? err.message : 'Impossible de réceptionner la commande.',
      });
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelOrder.mutateAsync(id);
      notifications.show({ color: 'green', message: 'Commande annulée.' });
    } catch (err) {
      notifications.show({
        color: 'red',
        message: err instanceof ApiError ? err.message : "Impossible d'annuler la commande.",
      });
    }
  }

  const orderColumns: DataTableColumn<PurchaseOrderDto>[] = [
    { key: 'createdAt', label: 'Date', render: (o) => formatDate(o.createdAt) },
    { key: 'supplierName', label: 'Fournisseur', render: (o) => o.supplierName },
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
    },
    {
      key: 'actions',
      label: '',
      render: (o) => (
        <Menu shadow="md" width={200} position="bottom-end">
          <Menu.Target>
            <UnstyledButton>
              <IconDotsVertical size={16} />
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => setSelectedOrder(o)}>Voir le détail</Menu.Item>
            {canManageOrders && o.status === 'PENDING' && (
              <>
                <Menu.Item
                  leftSection={<IconTruckDelivery size={16} />}
                  onClick={() => handleReceive(o.id)}
                >
                  Réceptionner
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconShoppingCartCancel size={16} />}
                  color="red"
                  onClick={() => handleCancel(o.id)}
                >
                  Annuler
                </Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>
      ),
    },
  ];

  const supplierColumns: DataTableColumn<SupplierDto>[] = [
    { key: 'name', label: 'Nom', render: (s) => s.name },
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
          <DataTable
            columns={orderColumns}
            rows={orders}
            rowKey={(o) => o.id}
            isLoading={isLoadingOrders}
            emptyMessage="Aucune commande enregistrée pour le moment."
          />
        </Tabs.Panel>

        <Tabs.Panel value="suppliers" pt="md">
          {canManageSuppliers && (
            <Button leftSection={<IconPlus size={16} />} onClick={openSupplierModal} mb="md">
              Nouveau fournisseur
            </Button>
          )}
          <DataTable
            columns={supplierColumns}
            rows={suppliers}
            rowKey={(s) => s.id}
            isLoading={isLoadingSuppliers}
            emptyMessage="Aucun fournisseur enregistré pour le moment."
          />
        </Tabs.Panel>
      </Tabs>

      <PurchaseOrderFormModal opened={orderModalOpened} onClose={closeOrderModal} />
      <SupplierFormModal opened={supplierModalOpened} onClose={closeSupplierModal} />
      <PurchaseOrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </>
  );
}
