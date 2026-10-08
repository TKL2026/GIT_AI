import type { PlatformAdminDto } from '@copilote/shared';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { adminApiClient, adminTokenStorage } from './adminApiClient';

interface AdminAuthContextValue {
  admin: PlatformAdminDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<PlatformAdminDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!adminTokenStorage.getAccessToken()) {
      setIsLoading(false);
      return;
    }
    adminApiClient
      .me()
      .then(setAdmin)
      .catch(() => adminTokenStorage.clear())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await adminApiClient.login(email, password);
    adminTokenStorage.setAccessToken(response.accessToken);
    setAdmin(response.admin);
  }, []);

  const logout = useCallback(() => {
    adminTokenStorage.clear();
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({ admin, isAuthenticated: !!admin, isLoading, login, logout }),
    [admin, isLoading, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth doit être utilisé dans un AdminAuthProvider.');
  }
  return context;
}
