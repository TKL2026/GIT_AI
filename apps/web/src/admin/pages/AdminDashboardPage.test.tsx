import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import * as useAdminDashboardHook from '../hooks/useAdminDashboard';
import { AdminDashboardPage } from './AdminDashboardPage';

vi.mock('../hooks/useAdminDashboard');

function renderPage() {
  return render(
    <MantineProvider>
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe('AdminDashboardPage', () => {
  it('affiche les KPIs calculés à partir des données réelles de la plateforme', () => {
    vi.mocked(useAdminDashboardHook.useAdminDashboard).mockReturnValue({
      data: {
        totalOrganizations: 42,
        totalUsers: 128,
        subscriptionStatusCounts: { ACTIVE: 10, TRIAL: 20, TRIAL_EXPIRED: 5, AWAITING_PAYMENT: 2 },
        organizationsWithoutSubscription: 5,
        totalRevenueCollected: 250000,
        planDistribution: [{ planCode: 'standard', planName: 'Standard', count: 7 }],
        recentOrganizations: [
          { id: 'org-1', name: 'Boutique Test', createdAt: '2026-10-01T00:00:00.000Z', planCode: 'standard', subscriptionStatus: 'ACTIVE' },
        ],
        signupsLast30Days: [{ date: '2026-10-01', count: 3 }],
      },
      isLoading: false,
    } as never);

    renderPage();

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Boutique Test')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
  });

  it("affiche un état de chargement tant que les données n'ont pas été reçues", () => {
    vi.mocked(useAdminDashboardHook.useAdminDashboard).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as never);

    renderPage();

    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    expect(screen.queryByText('Organisations')).not.toBeInTheDocument();
  });
});
