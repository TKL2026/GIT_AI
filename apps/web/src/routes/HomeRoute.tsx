import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LandingPage } from '../marketing/LandingPage';

/**
 * `/` sert deux publics différents : le site vitrine pour un visiteur non
 * connecté, et une redirection immédiate vers `/dashboard` pour un
 * utilisateur déjà authentifié (le Dashboard vit sur sa propre route pour
 * ne jamais entrer en collision avec la page d'accueil publique).
 */
export function HomeRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <p>Chargement...</p>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
}
