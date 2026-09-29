import { Role } from '@copilote/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import * as AuthContext from '../auth/AuthContext';
import { RoleGuard } from './RoleGuard';

vi.mock('../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof AuthContext>('../auth/AuthContext');
  return { ...actual, useAuth: vi.fn() };
});

function mockUser(role: Role | null) {
  vi.mocked(AuthContext.useAuth).mockReturnValue({
    user: role
      ? {
          id: '1',
          email: 'a@b.com',
          firstName: 'A',
          lastName: 'B',
          role,
          organizationId: 'org-1',
          createdAt: '',
          emailVerifiedAt: null,
        }
      : null,
    isAuthenticated: !!role,
    isLoading: false,
    login: vi.fn(),
    loginAsDemo: vi.fn(),
    register: vi.fn(),
    applyAuthResponse: vi.fn(),
    logout: vi.fn(),
  });
}

function renderGuard(roles: Role[]) {
  return render(
    <MemoryRouter initialEntries={['/finance']}>
      <Routes>
        <Route
          path="/finance"
          element={
            <RoleGuard roles={roles}>
              <div>Contenu protégé</div>
            </RoleGuard>
          }
        />
        <Route path="/dashboard" element={<div>Tableau de bord</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RoleGuard', () => {
  it('affiche le contenu si le rôle est autorisé', () => {
    mockUser(Role.OWNER);
    renderGuard([Role.OWNER, Role.ADMIN, Role.DIRECTOR]);
    expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
  });

  it('redirige vers /dashboard si le rôle est refusé', () => {
    mockUser(Role.CASHIER);
    renderGuard([Role.OWNER, Role.ADMIN, Role.DIRECTOR]);
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
  });

  it("redirige vers /dashboard si l'utilisateur n'est pas connecté", () => {
    mockUser(null);
    renderGuard([Role.OWNER, Role.ADMIN, Role.DIRECTOR]);
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
  });
});
