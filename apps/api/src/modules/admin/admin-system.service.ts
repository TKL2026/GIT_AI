import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";

export interface AdminSystemStatus {
  api: "ok";
  database: "ok" | "error";
  environment: string;
  integrations: {
    campay: boolean;
    anthropic: boolean;
    whatsapp: boolean;
    resend: boolean;
  };
}

@Injectable()
export class AdminSystemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /** Ne révèle jamais une valeur de secret — seulement si une intégration
   * est configurée ou non (booléen), jamais la clé elle-même. Pas d'appel
   * réseau sortant réel (évite tout coût/side-effect) : juste une vérification
   * de présence de configuration côté serveur. */
  async getStatus(): Promise<AdminSystemStatus> {
    let database: "ok" | "error" = "ok";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = "error";
    }

    const hasCamPayToken = Boolean(
      this.configService.get<string>("CAMPAY_PERMANENT_TOKEN"),
    );
    const hasCamPayUserPass = Boolean(
      this.configService.get<string>("CAMPAY_USERNAME") &&
      this.configService.get<string>("CAMPAY_PASSWORD"),
    );

    return {
      api: "ok",
      database,
      environment: this.configService.get<string>("NODE_ENV") ?? "development",
      integrations: {
        campay: hasCamPayToken || hasCamPayUserPass,
        anthropic: Boolean(this.configService.get<string>("ANTHROPIC_API_KEY")),
        whatsapp: Boolean(
          this.configService.get<string>("WHATSAPP_ACCESS_TOKEN"),
        ),
        resend: Boolean(this.configService.get<string>("RESEND_API_KEY")),
      },
    };
  }
}
