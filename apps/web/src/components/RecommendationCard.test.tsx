import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { describe, expect, it, vi } from 'vitest';
import { RecommendationCard } from './RecommendationCard';

describe('RecommendationCard', () => {
  it('affiche le label, le titre et la description', () => {
    render(
      <MantineProvider>
        <RecommendationCard
          severity="critical"
          icon={IconAlertTriangle}
          label="Stock critique"
          title="Riz 25kg"
          description="2 unités restantes."
        />
      </MantineProvider>,
    );
    expect(screen.getByText('Stock critique')).toBeInTheDocument();
    expect(screen.getByText('Riz 25kg')).toBeInTheDocument();
    expect(screen.getByText('2 unités restantes.')).toBeInTheDocument();
  });

  it('déclenche les actions au clic', () => {
    const onClick = vi.fn();
    render(
      <MantineProvider>
        <RecommendationCard
          severity="warning"
          icon={IconAlertTriangle}
          label="Réapprovisionnement"
          title="Sel"
          description="Recommandé : 10 unités."
          actions={[{ label: 'Voir le produit', onClick }]}
        />
      </MantineProvider>,
    );
    fireEvent.click(screen.getByText('Voir le produit'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('accepte la sévérité "opportunity"', () => {
    render(
      <MantineProvider>
        <RecommendationCard
          severity="opportunity"
          icon={IconAlertTriangle}
          label="Opportunité"
          title="Sel"
          description="Marge élevée, aucune vente récente."
        />
      </MantineProvider>,
    );
    expect(screen.getByText('Sel')).toBeInTheDocument();
  });

  it("ne rend aucun bouton sans actions", () => {
    render(
      <MantineProvider>
        <RecommendationCard
          severity="info"
          icon={IconAlertTriangle}
          label="Opportunité"
          title="Sel"
          description="Marge élevée."
        />
      </MantineProvider>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
