import { Role } from '@copilote/shared';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as AuthContext from '../../auth/AuthContext';
import * as useProductsHook from '../../hooks/useProducts';
import { ProductsPage } from './ProductsPage';

vi.mock('../../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof AuthContext>('../../auth/AuthContext');
  return { ...actual, useAuth: vi.fn() };
});
vi.mock('../../hooks/useProducts');

const product = {
  id: 'prod-1',
  organizationId: 'org-1',
  name: 'Riz 25kg',
  sku: 'RIZ25',
  purchasePrice: 100,
  salePrice: 150,
  stockQuantity: 20,
  minStock: 5,
  maxStock: null,
  stockStatus: 'ok' as const,
  isActive: true,
  createdAt: '2026-08-01T00:00:00.000Z',
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <BrowserRouter>
          <ProductsPage />
        </BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>,
  );
}

describe('ProductsPage', () => {
  beforeEach(() => {
    vi.mocked(useProductsHook.useCreateProduct).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never);
    vi.mocked(useProductsHook.useUpdateProduct).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never);
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: {
        id: '1',
        email: 'a@b.com',
        firstName: 'A',
        lastName: 'B',
        role: Role.OWNER,
        organizationId: 'org-1',
        createdAt: '',
        emailVerifiedAt: null,
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginAsDemo: vi.fn(),
      register: vi.fn(),
      applyAuthResponse: vi.fn(),
      logout: vi.fn(),
    } as never);
  });

  it('BUG-002 : catalogue vide affiche le message "aucun produit enregistré"', () => {
    vi.mocked(useProductsHook.useProducts).mockReturnValue({ data: [], isLoading: false } as never);
    renderPage();
    expect(screen.getByText('Aucun produit enregistré pour le moment.')).toBeInTheDocument();
  });

  it('BUG-002 : recherche sans résultat affiche un message différent, et le bouton effacer vide la recherche', () => {
    vi.mocked(useProductsHook.useProducts).mockReturnValue({
      data: [product],
      isLoading: false,
    } as never);
    renderPage();

    fireEvent.change(screen.getByPlaceholderText('Rechercher par nom ou SKU…'), {
      target: { value: 'inexistant' },
    });

    expect(screen.getByText('Aucun produit ne correspond à votre recherche.')).toBeInTheDocument();
    expect(screen.queryByText('Aucun produit enregistré pour le moment.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Effacer la recherche' }));
    expect(screen.getByText('Riz 25kg')).toBeInTheDocument();
  });
});
