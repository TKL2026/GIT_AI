import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

function mockResponse() {
  const res: { set: jest.Mock; send: jest.Mock } = {
    set: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };
  return res;
}

describe('ReportsController', () => {
  let controller: ReportsController;
  let reportsService: {
    getDailyReport: jest.Mock;
    getDailyReportsList: jest.Mock;
    getMonthlyReport: jest.Mock;
  };

  const currentUser = { userId: 'u1', email: 'a@b.com', role: 'OWNER', organizationId: 'org-1' } as const;

  const dailyReport = {
    date: '2026-10-18',
    dateLabel: '18/10/2026',
    organizationName: 'Boutique Awa',
    hasActivity: true,
    totalRevenue: 125000,
    totalExpenses: 0,
    totalCogs: 0,
    grossMargin: 125000,
    netProfit: 125000,
    salesCount: 7,
    topProducts: [],
    stockAlerts: [],
  };

  const monthlyReport = { ...dailyReport, month: '2026-10', monthLabel: 'octobre 2026' };

  beforeEach(() => {
    reportsService = {
      getDailyReport: jest.fn().mockResolvedValue(dailyReport),
      getDailyReportsList: jest.fn().mockResolvedValue([]),
      getMonthlyReport: jest.fn().mockResolvedValue(monthlyReport),
    };
    controller = new ReportsController(reportsService as unknown as ReportsService);
  });

  it('getDailyReport transmet organizationId (jamais un id du client) et la date demandée', async () => {
    await controller.getDailyReport(currentUser, { date: '2026-10-18' });
    expect(reportsService.getDailyReport).toHaveBeenCalledWith('org-1', '2026-10-18');
  });

  it('getDailyReportsList transmet organizationId, from et to', async () => {
    await controller.getDailyReportsList(currentUser, { from: '2026-10-01', to: '2026-10-18' });
    expect(reportsService.getDailyReportsList).toHaveBeenCalledWith('org-1', '2026-10-01', '2026-10-18');
  });

  it('getMonthlyReport transmet organizationId et le mois demandé', async () => {
    await controller.getMonthlyReport(currentUser, { month: '2026-10' });
    expect(reportsService.getMonthlyReport).toHaveBeenCalledWith('org-1', '2026-10');
  });

  it('getDailyReportPdf renvoie un PDF en Content-Type application/pdf avec un nom de fichier explicite', async () => {
    const res = mockResponse();
    await controller.getDailyReportPdf(currentUser, { date: '2026-10-18' }, res as never);

    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="UGE_Rapport_Journalier_2026-10-18.pdf"',
      }),
    );
    const [sentBuffer] = res.send.mock.calls[0];
    expect(Buffer.isBuffer(sentBuffer)).toBe(true);
    expect(sentBuffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
  });

  it('getMonthlyReportPdf renvoie un PDF avec un nom de fichier explicite', async () => {
    const res = mockResponse();
    await controller.getMonthlyReportPdf(currentUser, { month: '2026-10' }, res as never);

    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="UGE_Rapport_Mensuel_2026-10.pdf"',
      }),
    );
  });
});
