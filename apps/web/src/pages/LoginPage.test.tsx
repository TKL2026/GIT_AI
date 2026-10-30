import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import * as AuthContext from '../auth/AuthContext';
import { ApiError } from '../lib/apiClient';
import { LoginPage } from './LoginPage';

vi.mock('../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof AuthContext>('../auth/AuthContext');
  return { ...actual, useAuth: vi.fn() };
});

function renderPage() {
  return render(
    <MantineProvider>
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    </MantineProvider>,
  );
}

function mockAuth(overrides: Partial<ReturnType<typeof AuthContext.useAuth>> = {}) {
  vi.mocked(AuthContext.useAuth).mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    verifyLoginCode: vi.fn(),
    resendLoginCode: vi.fn(),
    loginAsDemo: vi.fn(),
    register: vi.fn(),
    applyAuthResponse: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  });
}

describe('LoginPage', () => {
  it('affiche le formulaire de connexion (étape identifiants)', () => {
    mockAuth();
    renderPage();

    expect(screen.getByAltText('UGE')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it("passe à l'étape code après des identifiants corrects, sans ouvrir de session", async () => {
    const login = vi.fn().mockResolvedValue({
      challengeToken: 'challenge-1',
      expiresInSeconds: 600,
      resendAvailableInSeconds: 60,
    });
    mockAuth({ login });

    renderPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'owner@demo.com' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText('Vérifiez votre adresse e-mail')).toBeInTheDocument();
    });
    expect(login).toHaveBeenCalledWith('owner@demo.com', 'Password123!');
    // Pas de redirection : verifyLoginCode n'a jamais été appelé.
    expect(screen.queryByText(/mot de passe oublié/i)).not.toBeInTheDocument();
  });

  it('affiche un message explicite si les identifiants sont incorrects (reste à l\'étape identifiants)', async () => {
    const login = vi.fn().mockRejectedValue(new ApiError(401, 'Identifiants invalides.'));
    mockAuth({ login });

    renderPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'owner@demo.com' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'mauvais' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Identifiants invalides.');
    });
    expect(screen.queryByText('Vérifiez votre adresse e-mail')).not.toBeInTheDocument();
  });

  it('code incorrect : message affiché, reste sur l\'étape code', async () => {
    const login = vi.fn().mockResolvedValue({
      challengeToken: 'challenge-1',
      expiresInSeconds: 600,
      resendAvailableInSeconds: 60,
    });
    const verifyLoginCode = vi
      .fn()
      .mockRejectedValue(new ApiError(401, 'Code incorrect. Il vous reste 4 tentative(s).', 'LOGIN_CODE_INVALID'));
    mockAuth({ login, verifyLoginCode });

    renderPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'owner@demo.com' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));
    await waitFor(() => screen.getByText('Vérifiez votre adresse e-mail'));

    const pinInputs = screen.getAllByPlaceholderText('○');
    pinInputs.forEach((input, i) => fireEvent.change(input, { target: { value: String(i) } }));
    fireEvent.click(screen.getByRole('button', { name: /vérifier le code/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Code incorrect. Il vous reste 4 tentative(s).');
    });
    // Toujours à l'étape code, pas de retour forcé aux identifiants.
    expect(screen.getByText('Vérifiez votre adresse e-mail')).toBeInTheDocument();
  });

  it('trop de tentatives : revient automatiquement à l\'étape identifiants avec le message', async () => {
    const login = vi.fn().mockResolvedValue({
      challengeToken: 'challenge-1',
      expiresInSeconds: 600,
      resendAvailableInSeconds: 60,
    });
    const verifyLoginCode = vi
      .fn()
      .mockRejectedValue(
        new ApiError(401, 'Trop de tentatives. Reconnectez-vous pour recevoir un nouveau code.', 'LOGIN_CODE_MAX_ATTEMPTS'),
      );
    mockAuth({ login, verifyLoginCode });

    renderPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'owner@demo.com' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));
    await waitFor(() => screen.getByText('Vérifiez votre adresse e-mail'));

    const pinInputs = screen.getAllByPlaceholderText('○');
    pinInputs.forEach((input, i) => fireEvent.change(input, { target: { value: String(i) } }));
    fireEvent.click(screen.getByRole('button', { name: /vérifier le code/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Trop de tentatives');
    });
    // Revenu à l'étape identifiants : le formulaire email/mot de passe est de retour.
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.queryByText('Vérifiez votre adresse e-mail')).not.toBeInTheDocument();
  });
});
