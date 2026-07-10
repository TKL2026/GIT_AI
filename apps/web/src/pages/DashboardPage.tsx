import { useAuth } from '../auth/AuthContext';

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <main>
      <h1>Tableau de bord</h1>
      <p>
        Bienvenue {user?.firstName} {user?.lastName} ({user?.role}).
      </p>
      <p>
        Cette page est un placeholder : les dashboards intelligents (chiffre d&apos;affaires,
        stock, alertes IA) seront ajoutés dans une prochaine passe.
      </p>
      <button type="button" onClick={logout}>
        Se déconnecter
      </button>
    </main>
  );
}
