import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import * as AdminAuthContext from './AdminAuthContext';
import { AdminProtectedRoute } from './AdminProtectedRoute';

vi.mock('./AdminAuthContext', async () => {
  const actual = await vi.importActual<typeof AdminAuthContext>('./AdminAuthContext');
  return { ...actual, useAdminAuth: vi.fn() };
});

function mockAuth(state: { isAuthenticated: boolean; isLoading: boolean }) {
  vi.mocked(AdminAuthContext.useAdminAuth).mockReturnValue({
    admin: state.isAuthenticated
      ? { id: 'admin-1', email: 'admin@uge.pro', firstName: 'Plateforme', lastName: 'Admin' }
      : null,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login: vi.fn(),
    logout: vi.fn(),
  });
}

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <div>Back-office protégé</div>
            </AdminProtectedRoute>
          }
        />
        <Route path="/admin/login" element={<div>Connexion admin</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AdminProtectedRoute', () => {
  it('affiche le contenu quand un PLATFORM_ADMIN est authentifié', () => {
    mockAuth({ isAuthenticated: true, isLoading: false });
    renderRoute();
    expect(screen.getByText('Back-office protégé')).toBeInTheDocument();
  });

  it('redirige vers /admin/login si non authentifié', () => {
    mockAuth({ isAuthenticated: false, isLoading: false });
    renderRoute();
    expect(screen.queryByText('Back-office protégé')).not.toBeInTheDocument();
    expect(screen.getByText('Connexion admin')).toBeInTheDocument();
  });

  it('affiche un état de chargement sans jamais montrer le contenu avant validation des droits', () => {
    mockAuth({ isAuthenticated: false, isLoading: true });
    renderRoute();
    expect(screen.queryByText('Back-office protégé')).not.toBeInTheDocument();
    expect(screen.queryByText('Connexion admin')).not.toBeInTheDocument();
  });
});
