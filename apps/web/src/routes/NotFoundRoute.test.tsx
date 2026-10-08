import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import * as AuthContext from '../auth/AuthContext';
import { NotFoundRoute } from './NotFoundRoute';

vi.mock('../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof AuthContext>('../auth/AuthContext');
  return { ...actual, useAuth: vi.fn() };
});

function mockAuth(isAuthenticated: boolean) {
  vi.mocked(AuthContext.useAuth).mockReturnValue({
    user: isAuthenticated
      ? {
          id: '1',
          email: 'a@b.com',
          firstName: 'A',
          lastName: 'B',
          role: 'OWNER',
          organizationId: 'org-1',
          createdAt: '',
          emailVerifiedAt: null,
        }
      : null,
    isAuthenticated,
    isLoading: false,
    login: vi.fn(),
    loginAsDemo: vi.fn(),
    register: vi.fn(),
    applyAuthResponse: vi.fn(),
    logout: vi.fn(),
  } as never);
}

function renderAtUnknownRoute() {
  return render(
    <MemoryRouter initialEntries={['/une-route-qui-n-existe-pas']}>
      <Routes>
        <Route path="/" element={<div>Landing publique</div>} />
        <Route path="/dashboard" element={<div>Tableau de bord</div>} />
        <Route path="*" element={<NotFoundRoute />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('NotFoundRoute', () => {
  it('BUG-011 : redirige un utilisateur authentifié vers /dashboard (pas la landing publique)', () => {
    mockAuth(true);
    renderAtUnknownRoute();
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    expect(screen.queryByText('Landing publique')).not.toBeInTheDocument();
  });

  it('redirige un visiteur non authentifié vers / (comportement inchangé)', () => {
    mockAuth(false);
    renderAtUnknownRoute();
    expect(screen.getByText('Landing publique')).toBeInTheDocument();
    expect(screen.queryByText('Tableau de bord')).not.toBeInTheDocument();
  });
});
