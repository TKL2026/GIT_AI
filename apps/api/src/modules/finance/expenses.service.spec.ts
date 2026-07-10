import { ExpenseCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ExpensesService } from './expenses.service';

describe('ExpensesService', () => {
  let expensesService: ExpensesService;
  let prisma: { expense: { create: jest.Mock; findMany: jest.Mock; findFirst: jest.Mock } };

  const organizationId = 'org-1';
  const userId = 'user-1';

  beforeEach(() => {
    prisma = {
      expense: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
    };

    expensesService = new ExpensesService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('persiste la dépense rattachée à l’organisation et à l’auteur', async () => {
      prisma.expense.create.mockResolvedValue({});

      await expensesService.create(organizationId, userId, {
        category: ExpenseCategory.RENT,
        amount: 150000,
        description: 'Loyer juillet',
      });

      expect(prisma.expense.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId,
          performedByUserId: userId,
          category: ExpenseCategory.RENT,
          amount: 150000,
          description: 'Loyer juillet',
        }),
      });
    });
  });

  describe('findAll', () => {
    it('applique le filtre de dates quand from/to sont fournis', async () => {
      prisma.expense.findMany.mockResolvedValue([]);

      await expensesService.findAll(organizationId, '2026-07-01', '2026-07-31');

      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: {
          organizationId,
          expenseDate: { gte: new Date('2026-07-01'), lte: new Date('2026-07-31') },
        },
        orderBy: { expenseDate: 'desc' },
      });
    });

    it('ne filtre pas par date quand aucune borne n’est fournie', async () => {
      prisma.expense.findMany.mockResolvedValue([]);

      await expensesService.findAll(organizationId);

      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: { organizationId },
        orderBy: { expenseDate: 'desc' },
      });
    });
  });
});
