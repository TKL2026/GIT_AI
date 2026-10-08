import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface AdminDashboardStats {
  totalOrganizations: number;
  totalUsers: number;
  /** Compte par statut d'abonnement réel (TRIAL, ACTIVE, AWAITING_PAYMENT...). */
  subscriptionStatusCounts: Record<string, number>;
  /** Organisations sans ligne Subscription du tout (accès libre — comptes
   * démo/historiques, voir schema.prisma). Calculé, jamais stocké. */
  organizationsWithoutSubscription: number;
  /** Somme des paiements CamPay réellement confirmés (SUCCESS) à ce jour —
   * un total encaissé, pas un MRR (qui nécessiterait des hypothèses sur le
   * renouvellement non vérifiables avec les données actuelles). */
  totalRevenueCollected: number;
  planDistribution: { planCode: string; planName: string; count: number }[];
  recentOrganizations: {
    id: string;
    name: string;
    createdAt: Date;
    planCode: string | null;
    subscriptionStatus: string | null;
  }[];
  signupsLast30Days: { date: string; count: number }[];
}

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<AdminDashboardStats> {
    const [
      totalOrganizations,
      totalUsers,
      subscriptionGroups,
      revenueAgg,
      planGroups,
      recentOrgs,
      signupRows,
    ] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.user.count(),
      this.prisma.subscription.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      this.prisma.paymentTransaction.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
      }),
      this.prisma.subscription.groupBy({
        by: ["planId"],
        _count: { _all: true },
        where: { planId: { not: null } },
      }),
      this.prisma.organization.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { subscription: { include: { plan: true } } },
      }),
      this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
        FROM "organizations"
        WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day ASC
      `,
    ]);

    const planIds = planGroups
      .map((g) => g.planId)
      .filter((id): id is string => Boolean(id));
    const plans = planIds.length
      ? await this.prisma.plan.findMany({ where: { id: { in: planIds } } })
      : [];
    const planById = new Map(plans.map((p) => [p.id, p]));

    const subscriptionStatusCounts = Object.fromEntries(
      subscriptionGroups.map((g) => [g.status, g._count._all]),
    );
    const organizationsWithSubscription = subscriptionGroups.reduce(
      (sum, g) => sum + g._count._all,
      0,
    );

    return {
      totalOrganizations,
      totalUsers,
      subscriptionStatusCounts,
      organizationsWithoutSubscription:
        totalOrganizations - organizationsWithSubscription,
      totalRevenueCollected: revenueAgg._sum.amount ?? 0,
      planDistribution: planGroups
        .filter((g) => g.planId)
        .map((g) => {
          const plan = planById.get(g.planId!);
          return {
            planCode: plan?.code ?? "inconnu",
            planName: plan?.name ?? "Inconnu",
            count: g._count._all,
          };
        }),
      recentOrganizations: recentOrgs.map((org) => ({
        id: org.id,
        name: org.name,
        createdAt: org.createdAt,
        planCode: org.subscription?.plan?.code ?? null,
        subscriptionStatus: org.subscription?.status ?? null,
      })),
      signupsLast30Days: signupRows.map((row) => ({
        date: row.day.toISOString().slice(0, 10),
        count: Number(row.count),
      })),
    };
  }
}
