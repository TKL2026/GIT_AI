import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { IconBoxSeam } from '@tabler/icons-react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from './EmptyState';

function renderState(props: Partial<React.ComponentProps<typeof EmptyState>> = {}) {
  return render(
    <MantineProvider>
      <BrowserRouter>
        <EmptyState icon={IconBoxSeam} title="Aucune donnée" {...props} />
      </BrowserRouter>
    </MantineProvider>,
  );
}

describe('EmptyState', () => {
  it('affiche le titre', () => {
    renderState();
    expect(screen.getByText('Aucune donnée')).toBeInTheDocument();
  });

  it('affiche la description quand fournie', () => {
    renderState({ description: 'Commencez par enregistrer votre première vente.' });
    expect(screen.getByText('Commencez par enregistrer votre première vente.')).toBeInTheDocument();
  });

  it("n'affiche aucun bouton sans action", () => {
    renderState();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('affiche un lien de navigation quand action.to est fourni', () => {
    renderState({ action: { label: 'Créer une vente', to: '/sales' } });
    const link = screen.getByRole('link', { name: 'Créer une vente' });
    expect(link).toHaveAttribute('href', '/sales');
  });

  it('déclenche onClick quand action.onClick est fourni sans to', () => {
    const onClick = vi.fn();
    renderState({ action: { label: 'Actualiser', onClick } });
    fireEvent.click(screen.getByRole('button', { name: 'Actualiser' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
