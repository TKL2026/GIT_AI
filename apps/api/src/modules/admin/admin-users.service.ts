import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Role } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminUsersQueryDto } from "./dto/admin-users-query.dto";

export interface AdminUserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string;
  organizationName: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: AdminUsersQueryDto,
  ): Promise<{ data: AdminUserListItem[]; total: number }> {
    const { page, pageSize, search, organizationId } = query;

    const where: Prisma.UserWhereInput = {
      ...(organizationId ? { organizationId } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { organization: { select: { name: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      total,
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
      })),
    };
  }

  async getDetail(id: string): Promise<AdminUserListItem> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { organization: { select: { name: true } } },
    });
    if (!user) {
      throw new NotFoundException("Utilisateur introuvable.");
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
    };
  }
}
