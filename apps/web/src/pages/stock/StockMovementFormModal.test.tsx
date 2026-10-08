import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../lib/apiClient';
import * as useProductsHook from '../../hooks/useProducts';
import * as useStockHook from '../../hooks/useStock';
import { StockMovementFormModal } from './StockMovementFormModal';

vi.mock('../../hooks/useProducts');
vi.mock('../../hooks/useStock');

const product = {
  id: 'prod-1',
  organizationId: 'org-1',
  name: 'Riz 25kg',
  sku: 'RIZ25',
  purchasePrice: 100,
  salePrice: 150,
  stockQuantity: 5,
  minStock: null,
  maxStock: null,
  stockStatus: 'ok' as const,
  isActive: true,
  createdAt: '2026-08-01T00:00:00.000Z',
};

function renderModal() {
  return render(
    <MantineProvider>
      <StockMovementFormModal opened onClose={() => {}} />
    </MantineProvider>,
  );
}

function getInputByPath(path: string): HTMLElement {
  // Mantine Modal rend son contenu dans un portail attaché à document.body,
  // en dehors du container retourné par render().
  const input = document.body.querySelector(`[data-path="${path}"]`);
  if (!input) throw new Error(`Input with data-path="${path}" not found`);
  return input as HTMLElement;
}

describe('StockMovementFormModal', () => {
  it('BUG-005 : affiche une alerte inline persistante quand le stock est insuffisant', async () => {
    vi.mocked(useProductsHook.useProducts).mockReturnValue({ data: [product] } as never);
    const recordOut = vi.fn().mockRejectedValue(
      new ApiError(400, 'Stock insuffisant pour Riz 25kg (demandé : 999, disponible : 5).'),
    );
    vi.mocked(useStockHook.useRecordStockOut).mockReturnValue({
      mutateAsync: recordOut,
      isPending: false,
    } as never);
    vi.mocked(useStockHook.useRecordStockIn).mockReturnValue({ isPending: false } as never);
    vi.mocked(useStockHook.useRecordStockAdjustment).mockReturnValue({ isPending: false } as never);

    renderModal();

    fireEvent.click(screen.getByText('Sortie'));
    const productInput = screen.getByPlaceholderText('Sélectionner un produit');
    fireEvent.mouseDown(productInput);
    fireEvent.change(productInput, { target: { value: 'Riz' } });
    fireEvent.click(await screen.findByText('Riz 25kg (RIZ25)'));
    fireEvent.change(getInputByPath('quantity'), { target: { value: '999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => {
      expect(
        screen.getByText('Stock insuffisant pour Riz 25kg (demandé : 999, disponible : 5).'),
      ).toBeInTheDocument();
    });
  });
});
