import { Injectable } from "@nestjs/common";
import { AdminAuditLog, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export interface RecordAuditLogInput {
  platformAdminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export type AdminAuditLogWithAuthor = AdminAuditLog & {
  platformAdmin: { email: string; firstName: string; lastName: string };
};

@Injectable()
export class AdminAuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * `tx` optionnel : pour les actions sensibles (suspension, etc.), l'appelant
   * doit passer le client de transaction de l'action elle-même, afin que
   * l'entrée d'audit et la mutation métier réussissent ou échouent ensemble
   * (jamais d'action sans trace, jamais de trace d'une action qui a échoué).
   */
  async record(
    input: RecordAuditLogInput,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.adminAuditLog.create({
      data: {
        platformAdminId: input.platformAdminId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: input.metadata
          ? (input.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  }

  async list(params: {
    page: number;
    pageSize: number;
  }): Promise<{ data: AdminAuditLogWithAuthor[]; total: number }> {
    const { page, pageSize } = params;
    const [data, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          platformAdmin: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.adminAuditLog.count(),
    ]);
    return { data, total };
  }
}
