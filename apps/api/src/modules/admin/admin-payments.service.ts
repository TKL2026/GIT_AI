import { Injectable } from "@nestjs/common";
import {
  MobileMoneyOperator,
  PaymentTransactionStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminPaymentsQueryDto } from "./dto/admin-payments-query.dto";

export interface AdminPaymentListItem {
  id: string;
  organizationId: string;
  organizationName: string;
  planCode: string;
  planName: string;
  amount: number;
  currency: string;
  operator: MobileMoneyOperator;
  status: PaymentTransactionStatus;
  externalReference: string;
  providerReference: string | null;
  createdAt: Date;
  paidAt: Date | null;
}

@Injectable()
export class AdminPaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: AdminPaymentsQueryDto,
  ): Promise<{ data: AdminPaymentListItem[]; total: number }> {
    const { page, pageSize, search, status, organizationId } = query;

    const where: Prisma.PaymentTransactionWhereInput = {
      ...(status ? { status } : {}),
      ...(organizationId ? { organizationId } : {}),
      ...(search
        ? { organization: { name: { contains: search, mode: "insensitive" } } }
        : {}),
    };

    const [transactions, total] = await Promise.all([
      this.prisma.paymentTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          organization: { select: { name: true } },
          plan: { select: { code: true, name: true } },
        },
      }),
      this.prisma.paymentTransaction.count({ where }),
    ]);

    return {
      total,
      // Jamais providerStatusRaw / metadata brut ici : uniquement les champs
      // nécessaires à un support de premier niveau, aucun secret stocké de
      // toute façon sur ce modèle (ni token CamPay, ni clé API).
      data: transactions.map((tx) => ({
        id: tx.id,
        organizationId: tx.organizationId,
        organizationName: tx.organization.name,
        planCode: tx.plan.code,
        planName: tx.plan.name,
        amount: tx.amount,
        currency: tx.currency,
        operator: tx.operator,
        status: tx.status,
        externalReference: tx.externalReference,
        providerReference: tx.providerReference,
        createdAt: tx.createdAt,
        paidAt: tx.paidAt,
      })),
    };
  }
}
