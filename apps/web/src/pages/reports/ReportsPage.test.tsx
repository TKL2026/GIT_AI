import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import * as useReportsHook from '../../hooks/useReports';
import * as downloadBlobModule from '../../lib/downloadBlob';
import { ReportsPage } from './ReportsPage';

vi.mock('../../hooks/useReports');
vi.mock('../../lib/downloadBlob');

function renderPage() {
  return render(
    <MantineProvider>
      <ReportsPage />
    </MantineProvider>,
  );
}

const dailyRows = [
  { date: '2026-10-27', dateLabel: '27/10/2026', totalRevenue: 125000, salesCount: 7, hasActivity: true },
  { date: '2026-10-26', dateLabel: '26/10/2026', totalRevenue: 0, salesCount: 0, hasActivity: false },
];

function setupDefaultMocks() {
  vi.mocked(useReportsHook.useDailyReportsList).mockReturnValue({
    data: dailyRows,
    isLoading: false,
  } as never);
  vi.mocked(useReportsHook.useMonthlyReport).mockReturnValue({
    data: { hasActivity: false },
    isLoading: false,
  } as never);
  vi.mocked(useReportsHook.useDailyReport).mockReturnValue({
    data: undefined,
    isLoading: false,
  } as never);
  vi.mocked(useReportsHook.useDownloadDailyReportPdf).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
  vi.mocked(useReportsHook.useDownloadMonthlyReportPdf).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
}

describe('ReportsPage', () => {
  it('affiche la liste des rapports journaliers, y compris les journées sans activité', () => {
    setupDefaultMocks();
    renderPage();

    expect(screen.getByText('27/10/2026')).toBeInTheDocument();
    expect(screen.getByText('26/10/2026')).toBeInTheDocument();
    expect(screen.getByText('Aucune activité')).toBeInTheDocument();
  });

  it('déclenche le téléchargement du PDF journalier avec le bon nom de fichier', async () => {
    setupDefaultMocks();
    const mutate = vi.fn((_date: string, options?: { onSuccess?: (blob: Blob) => void }) => {
      options?.onSuccess?.(new Blob(['%PDF-fake']));
    });
    vi.mocked(useReportsHook.useDownloadDailyReportPdf).mockReturnValue({
      mutate,
      isPending: false,
    } as never);

    renderPage();

    const pdfButtons = screen.getAllByRole('button', { name: 'PDF' });
    fireEvent.click(pdfButtons[0]);

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith('2026-10-27', expect.anything());
      expect(downloadBlobModule.downloadBlob).toHaveBeenCalledWith(
        expect.any(Blob),
        'UGE_Rapport_Journalier_2026-10-27.pdf',
      );
    });
  });

  it("ouvre le détail d'un jour au clic sur le bouton Détail", async () => {
    setupDefaultMocks();
    renderPage();

    fireEvent.click(screen.getAllByRole('button', { name: 'Détail' })[0]);

    await waitFor(() => {
      expect(useReportsHook.useDailyReport).toHaveBeenCalled();
    });
  });

  it('affiche un état vide pour le mois sélectionné quand aucune activité', async () => {
    setupDefaultMocks();
    renderPage();

    fireEvent.click(screen.getByRole('tab', { name: /Mensuel/ }));

    await waitFor(() => {
      expect(screen.getByText('Aucune activité ce mois-ci.')).toBeInTheDocument();
    });
  });

  it('affiche les indicateurs du mois quand il y a de l’activité', async () => {
    setupDefaultMocks();
    vi.mocked(useReportsHook.useMonthlyReport).mockReturnValue({
      data: {
        month: '2026-10',
        monthLabel: 'octobre 2026',
        organizationName: 'Boutique Awa',
        hasActivity: true,
        totalRevenue: 2500000,
        totalExpenses: 150000,
        totalCogs: 1200000,
        grossMargin: 1300000,
        netProfit: 1150000,
        salesCount: 140,
        topProducts: [],
        stockAlerts: [],
      },
      isLoading: false,
    } as never);

    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /Mensuel/ }));

    await waitFor(() => {
      expect(screen.getByText('octobre 2026')).toBeInTheDocument();
    });
  });

  it("anomalie QA #4 : le montant des produits est explicitement libellé comme une marge, sous le titre « Produits les plus rentables »", async () => {
    setupDefaultMocks();
    vi.mocked(useReportsHook.useMonthlyReport).mockReturnValue({
      data: {
        month: '2026-10',
        monthLabel: 'octobre 2026',
        organizationName: 'Boutique Awa',
        hasActivity: true,
        totalRevenue: 2500000,
        totalExpenses: 150000,
        totalCogs: 1200000,
        grossMargin: 1300000,
        netProfit: 1150000,
        salesCount: 140,
        topProducts: [
          { productId: 'p1', productName: 'Riz', quantitySold: 10, totalRevenue: 50000, estimatedCost: 30000, estimatedMargin: 20000 },
        ],
        stockAlerts: [],
      },
      isLoading: false,
    } as never);

    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /Mensuel/ }));

    await waitFor(() => {
      expect(screen.getByText('Produits les plus rentables')).toBeInTheDocument();
      expect(screen.getByText(/Marge estimée/)).toBeInTheDocument();
      expect(screen.queryByText('Produits les plus vendus')).not.toBeInTheDocument();
    });
  });
});
