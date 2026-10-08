import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../lib/apiClient';
import * as AdminAuthContext from '../AdminAuthContext';
import { AdminLoginPage } from './AdminLoginPage';

vi.mock('../AdminAuthContext', async () => {
  const actual = await vi.importActual<typeof AdminAuthContext>('../AdminAuthContext');
  return { ...actual, useAdminAuth: vi.fn() };
});

function renderPage() {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={['/admin/login']}>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<div>Tableau de bord admin</div>} />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe('AdminLoginPage', () => {
  it('affiche le formulaire de connexion admin', () => {
    vi.mocked(AdminAuthContext.useAdminAuth).mockReturnValue({
      admin: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderPage();

    expect(screen.getByRole('form', { name: 'Connexion administrateur' })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
  });

  it('affiche le message d’erreur renvoyé par le backend en cas d’échec', async () => {
    const login = vi.fn().mockRejectedValue(new ApiError(401, 'Identifiants invalides.'));
    vi.mocked(AdminAuthContext.useAdminAuth).mockReturnValue({
      admin: null,
      isAuthenticated: false,
      isLoading: false,
      login,
      logout: vi.fn(),
    });

    renderPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@uge.pro' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(screen.getByText('Identifiants invalides.')).toBeInTheDocument();
    });
    expect(screen.queryByText('Tableau de bord admin')).not.toBeInTheDocument();
  });

  it('navigue vers /admin après une connexion réussie', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    vi.mocked(AdminAuthContext.useAdminAuth).mockReturnValue({
      admin: null,
      isAuthenticated: false,
      isLoading: false,
      login,
      logout: vi.fn(),
    });

    renderPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@uge.pro' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'CorrectPassword123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(screen.getByText('Tableau de bord admin')).toBeInTheDocument();
    });
  });
});
