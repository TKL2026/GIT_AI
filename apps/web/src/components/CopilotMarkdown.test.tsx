import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CopilotMarkdown } from './CopilotMarkdown';

function renderMarkdown(content: string) {
  return render(
    <MantineProvider>
      <CopilotMarkdown>{content}</CopilotMarkdown>
    </MantineProvider>,
  );
}

describe('CopilotMarkdown', () => {
  it('BUG-009 : rend un tableau GFM comme un vrai tableau HTML, pas du texte brut', () => {
    const { container } = renderMarkdown(
      '| Produit | Marge |\n| --- | --- |\n| Riz | 3000 |\n| Huile | 2000 |',
    );

    expect(container.querySelector('table')).toBeInTheDocument();
    expect(screen.getByText('Produit')).toBeInTheDocument();
    expect(screen.getByText('Marge')).toBeInTheDocument();
    expect(screen.getByText('Riz')).toBeInTheDocument();
    expect(screen.getByText('3000')).toBeInTheDocument();
  });

  it('ne casse pas le rendu du texte, gras, listes, liens et code déjà supportés', () => {
    renderMarkdown(
      '**Important** : voici une liste :\n- premier\n- deuxième\n\nVoir [ce lien](https://example.com) ou `code inline`.',
    );

    expect(screen.getByText('Important')).toBeInTheDocument();
    expect(screen.getByText('premier')).toBeInTheDocument();
    expect(screen.getByText('deuxième')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ce lien' })).toHaveAttribute('href', 'https://example.com');
    expect(screen.getByText('code inline')).toBeInTheDocument();
  });
});
