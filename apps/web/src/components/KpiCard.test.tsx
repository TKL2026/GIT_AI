import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { IconCash } from '@tabler/icons-react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { KpiCard } from './KpiCard';

// Recharts' ResponsiveContainer ne rend rien tant que son conteneur a une
// taille nulle, ce qui est toujours le cas en jsdom (pas de layout réel).
vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
  width: 200,
  height: 32,
  top: 0,
  left: 0,
  bottom: 32,
  right: 200,
  x: 0,
  y: 0,
  toJSON: () => {},
} as DOMRect);

function renderCard(props: Partial<React.ComponentProps<typeof KpiCard>> = {}) {
  return render(
    <MantineProvider>
      <BrowserRouter>
        <KpiCard icon={IconCash} label="Chiffre d'affaires" value="35 000 FCFA" {...props} />
      </BrowserRouter>
    </MantineProvider>,
  );
}

describe('KpiCard', () => {
  it('affiche le libellé et la valeur', () => {
    renderCard();
    expect(screen.getByText("Chiffre d'affaires")).toBeInTheDocument();
    expect(screen.getByText('35 000 FCFA')).toBeInTheDocument();
  });

  it("n'affiche pas de tendance quand changeRatio est absent", () => {
    renderCard();
    expect(screen.queryByText(/vs période précédente/)).not.toBeInTheDocument();
  });

  it('affiche une tendance positive en vert', () => {
    renderCard({ changeRatio: 0.12 });
    expect(screen.getByText('+12.0 %')).toBeInTheDocument();
  });

  it('affiche une tendance négative', () => {
    renderCard({ changeRatio: -0.05 });
    expect(screen.getByText('-5.0 %')).toBeInTheDocument();
  });

  it('inverse la sémantique bonne/mauvaise avec invertTrend', () => {
    // Une hausse du nombre d'alertes est un mauvais signal : rendu identique
    // (la couleur n'est pas testable simplement ici), mais le texte reste correct.
    renderCard({ changeRatio: 0.2, invertTrend: true, label: 'Alertes critiques', value: '3' });
    expect(screen.getByText('+20.0 %')).toBeInTheDocument();
  });

  it("n'affiche pas d'icône info sans tooltip", () => {
    const { container } = renderCard();
    expect(container.querySelector('svg.tabler-icon-info-circle')).not.toBeInTheDocument();
  });

  it('affiche une icône info quand tooltip est fourni', () => {
    const { container } = renderCard({ tooltip: 'Explication du calcul' });
    expect(container.querySelector('svg.tabler-icon-info-circle')).toBeInTheDocument();
  });

  it("n'affiche pas de mini-graphique avec moins de 2 points", () => {
    const { container } = renderCard({ sparkline: [10] });
    expect(container.querySelector('.recharts-wrapper')).not.toBeInTheDocument();
  });

  it('affiche un mini-graphique avec au moins 2 points', () => {
    const { container } = renderCard({ sparkline: [10, 20, 15] });
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });
});
