import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/**
 * BUG-011 : une URL inconnue renvoyait systématiquement vers la landing
 * publique, même pour un utilisateur déjà authentifié — déroutant en pleine
 * session applicative. Un utilisateur connecté retourne désormais vers son
 * tableau de bord avec une notification ; le comportement public (`/`)
 * reste inchangé pour un visiteur non authentifié.
 */
export function NotFoundRoute() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      notifications.show({
        color: 'blue',
        message: 'Page introuvable — retour à votre tableau de bord.',
      });
    }
  }, [isAuthenticated]);

  return <Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />;
}
