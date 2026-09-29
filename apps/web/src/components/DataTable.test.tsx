import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, type DataTableColumn } from './DataTable';

interface Row {
  id: string;
  name: string;
  amount: number;
}

const rows: Row[] = [
  { id: '1', name: 'Banane', amount: 300 },
  { id: '2', name: 'Ananas', amount: 100 },
  { id: '3', name: 'Citron', amount: 200 },
];

const columns: DataTableColumn<Row>[] = [
  { key: 'name', label: 'Nom', render: (r) => r.name, sortValue: (r) => r.name },
  { key: 'amount', label: 'Montant', render: (r) => String(r.amount), sortValue: (r) => r.amount },
];

function renderTable(props: Partial<React.ComponentProps<typeof DataTable<Row>>> = {}) {
  return render(
    <MantineProvider>
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} {...props} />
    </MantineProvider>,
  );
}

describe('DataTable', () => {
  it('affiche toutes les lignes par défaut', () => {
    renderTable();
    expect(screen.getByText('Banane')).toBeInTheDocument();
    expect(screen.getByText('Ananas')).toBeInTheDocument();
    expect(screen.getByText('Citron')).toBeInTheDocument();
  });

  it("affiche le message vide quand il n'y a aucune ligne", () => {
    renderTable({ rows: [], emptyMessage: 'Rien ici.' });
    expect(screen.getByText('Rien ici.')).toBeInTheDocument();
  });

  it('affiche des lignes squelettes pendant le chargement', () => {
    const { container } = renderTable({ isLoading: true });
    expect(screen.queryByText('Banane')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.mantine-Skeleton-root').length).toBeGreaterThan(0);
  });

  it('trie les lignes en cliquant sur un en-tête triable', () => {
    renderTable();
    const nameHeader = screen.getByRole('button', { name: /Nom/i });

    fireEvent.click(nameHeader);
    let cells = screen.getAllByRole('row').slice(1).map((row) => row.textContent);
    expect(cells[0]).toContain('Ananas');

    fireEvent.click(nameHeader);
    cells = screen.getAllByRole('row').slice(1).map((row) => row.textContent);
    expect(cells[0]).toContain('Citron');
  });

  it('pagine côté client quand pageSize est fourni', () => {
    renderTable({ pageSize: 2 });
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 rows
    expect(screen.getByText('2')).toBeInTheDocument(); // pagination control shows page 2
  });

  it('déclenche onRowClick au clic sur une ligne', () => {
    const onRowClick = vi.fn();
    renderTable({ onRowClick });
    fireEvent.click(screen.getByText('Banane'));
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it('déclenche onRowClick au clavier (Entrée) sur une ligne focalisée', () => {
    const onRowClick = vi.fn();
    renderTable({ onRowClick });
    const row = screen.getByText('Banane').closest('tr')!;
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it("n'active pas de comportement clic/clavier sans onRowClick", () => {
    renderTable();
    const row = screen.getByText('Banane').closest('tr')!;
    expect(row).not.toHaveAttribute('role', 'button');
    expect(row).not.toHaveAttribute('tabindex');
  });
});
