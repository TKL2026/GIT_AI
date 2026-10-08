import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PlatformAdmin } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminAuditLogService } from "./admin-audit-log.service";
import { AdminLoginDto } from "./dto/admin-login.dto";

export interface PlatformAdminLoginResult {
  admin: PlatformAdmin;
  accessToken: string;
}

@Injectable()
export class PlatformAdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogService: AdminAuditLogService,
  ) {}

  async login(dto: AdminLoginDto): Promise<PlatformAdminLoginResult> {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { email: dto.email },
    });

    // Même message pour "email inconnu", "mot de passe incorrect" et "compte
    // désactivé" — n'importe laquelle de ces distinctions permettrait à un
    // attaquant d'énumérer les comptes admin existants (même principe que
    // AuthService#login côté tenant).
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException("Identifiants invalides.");
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      admin.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException("Identifiants invalides.");
    }

    const accessToken = await this.issueToken(admin);

    await this.prisma.$transaction(async (tx) => {
      await tx.platformAdmin.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });
      await this.auditLogService.record(
        { platformAdminId: admin.id, action: "admin.login" },
        tx,
      );
    });

    return { admin, accessToken };
  }

  findById(id: string): Promise<PlatformAdmin | null> {
    return this.prisma.platformAdmin.findUnique({ where: { id } });
  }

  private issueToken(admin: PlatformAdmin): Promise<string> {
    return this.jwtService.signAsync(
      { sub: admin.id, email: admin.email, type: "platform_admin" },
      {
        secret: this.configService.get<string>("JWT_PLATFORM_ADMIN_SECRET"),
        expiresIn:
          this.configService.get<string>("JWT_PLATFORM_ADMIN_EXPIRES_IN") ??
          "8h",
      },
    );
  }
}
