import { Role } from '@copilote/shared';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as AuthContext from '../auth/AuthContext';
import * as useUsersHook from '../hooks/useUsers';
import * as useInvitesHook from '../hooks/useInvites';
import { UsersPage } from './UsersPage';

vi.mock('../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof AuthContext>('../auth/AuthContext');
  return { ...actual, useAuth: vi.fn() };
});
vi.mock('../hooks/useUsers');
vi.mock('../hooks/useInvites');

function mockUser(role: Role) {
  vi.mocked(AuthContext.useAuth).mockReturnValue({
    user: {
      id: '1',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
      role,
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
  });
}

function renderPage() {
  return render(
    <MantineProvider>
      <BrowserRouter>
        <UsersPage />
      </BrowserRouter>
    </MantineProvider>,
  );
}

describe('UsersPage', () => {
  beforeEach(() => {
    vi.mocked(useUsersHook.useUsers).mockReturnValue({ data: [], isLoading: false } as never);
    vi.mocked(useInvitesHook.useInvites).mockReturnValue({ data: [] } as never);
    vi.mocked(useInvitesHook.useCreateInvite).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never);
  });

  it('BUG-010 : affiche "Inviter un utilisateur" pour un OWNER', () => {
    mockUser(Role.OWNER);
    renderPage();
    expect(screen.getByRole('button', { name: /Inviter un utilisateur/i })).toBeInTheDocument();
  });

  it('BUG-010 : masque "Inviter un utilisateur" pour un rôle non-OWNER', () => {
    mockUser(Role.CASHIER);
    renderPage();
    expect(screen.queryByRole('button', { name: /Inviter un utilisateur/i })).not.toBeInTheDocument();
  });
});
