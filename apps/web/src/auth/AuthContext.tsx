import type { AuthResponseDto, UserDto } from '@copilote/shared';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiClient, tokenStorage } from '../lib/apiClient';

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthContextValue {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  /** Créé le compte + l'organisation (nom d'entreprise renseigné à l'écran
   * suivant de l'onboarding) et connecte immédiatement l'utilisateur. */
  register: (input: RegisterInput) => Promise<void>;
  /** Stocke les tokens et l'utilisateur reçus d'un flux d'authentification
   * externe à ce contexte (ex: acceptation d'une invitation d'équipe) —
   * évite de dupliquer la logique de stockage de session. */
  applyAuthResponse: (response: AuthResponseDto) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tokenStorage.getAccessToken()) {
      setIsLoading(false);
      return;
    }
    apiClient
      .get<UserDto>('/users/me')
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiClient.login(email, password);
    tokenStorage.setTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
  }, []);

  const loginAsDemo = useCallback(async () => {
    const response = await apiClient.demoLogin();
    tokenStorage.setTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const response = await apiClient.register(input);
    tokenStorage.setTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
  }, []);

  const applyAuthResponse = useCallback((response: AuthResponseDto) => {
    tokenStorage.setTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      loginAsDemo,
      register,
      applyAuthResponse,
      logout,
    }),
    [user, isLoading, login, loginAsDemo, register, applyAuthResponse, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider.');
  }
  return context;
}
