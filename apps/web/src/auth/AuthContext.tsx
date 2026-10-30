import type { AuthResponseDto, LoginChallengeResponseDto, UserDto } from '@copilote/shared';
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
  /** Code de l'offre payante choisie avant l'inscription — voir
   * pendingPlan.ts. Absent = essai gratuit de 7 jours. */
  planCode?: string;
}

interface AuthContextValue {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Étape 1/2 : identifiants corrects => renvoie une référence au code
   * envoyé par email, n'ouvre pas de session (voir verifyLoginCode). */
  login: (email: string, password: string) => Promise<LoginChallengeResponseDto>;
  /** Étape 2/2 : seule méthode qui ouvre réellement une session. */
  verifyLoginCode: (challengeToken: string, code: string) => Promise<void>;
  resendLoginCode: (challengeToken: string) => Promise<LoginChallengeResponseDto>;
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
    return apiClient.login(email, password);
  }, []);

  const verifyLoginCode = useCallback(async (challengeToken: string, code: string) => {
    const response = await apiClient.verifyLoginCode(challengeToken, code);
    tokenStorage.setTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
  }, []);

  const resendLoginCode = useCallback(async (challengeToken: string) => {
    return apiClient.resendLoginCode(challengeToken);
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
      verifyLoginCode,
      resendLoginCode,
      loginAsDemo,
      register,
      applyAuthResponse,
      logout,
    }),
    [
      user,
      isLoading,
      login,
      verifyLoginCode,
      resendLoginCode,
      loginAsDemo,
      register,
      applyAuthResponse,
      logout,
    ],
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
