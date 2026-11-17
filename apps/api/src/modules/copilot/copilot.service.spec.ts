import { ConfigService } from "@nestjs/config";
import { CopilotEngine } from "@copilote/copilot-engine";
import { PrismaService } from "../../prisma/prisma.service";
import { CopilotQuotaService } from "../../common/entitlements/copilot-quota.service";
import { CopilotUserQuotaService } from "../../common/entitlements/copilot-user-quota.service";
import { ErpDataProvider } from "./erp-data-provider";
import { CopilotService } from "./copilot.service";

describe("CopilotService", () => {
  let service: CopilotService;
  let configService: { get: jest.Mock };
  let prisma: { subscription: { findUnique: jest.Mock }; copilotUsageLog: { create: jest.Mock } };
  let copilotQuotaService: { releaseOne: jest.Mock };
  let copilotUserQuotaService: { releaseOne: jest.Mock };
  let engineChat: jest.SpyInstance;

  const organizationId = "org-1";
  const userId = "user-1";

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => (key === "ANTHROPIC_API_KEY" ? "fake-key" : undefined)),
    };
    prisma = {
      subscription: { findUnique: jest.fn().mockResolvedValue({ status: "ACTIVE", copilotRequestsUsed: 3 }) },
      copilotUsageLog: { create: jest.fn().mockResolvedValue({}) },
    };
    copilotQuotaService = { releaseOne: jest.fn().mockResolvedValue(undefined) };
    copilotUserQuotaService = { releaseOne: jest.fn().mockResolvedValue(undefined) };

    service = new CopilotService(
      configService as unknown as ConfigService,
      {} as unknown as ErpDataProvider,
      prisma as unknown as PrismaService,
      copilotQuotaService as unknown as CopilotQuotaService,
      copilotUserQuotaService as unknown as CopilotUserQuotaService,
    );

    // CopilotEngine est construit en interne (clé API factice) — on
    // intercepte sa méthode chat() directement plutôt que de fournir un
    // faux client Anthropic, pour rester concentré sur la logique de
    // restitution/journalisation propre à CopilotService.
    engineChat = jest.spyOn(CopilotEngine.prototype, "chat");
  });

  afterEach(() => {
    engineChat.mockRestore();
  });

  it("ne relâche rien et journalise l'usage quand l'appel réussit", async () => {
    engineChat.mockResolvedValue({
      message: "Bonjour !",
      model: "claude-haiku-4-5-20251001",
      inputTokens: 10,
      outputTokens: 5,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
      toolsUsed: [],
    });

    const result = await service.chat(organizationId, userId, false, [{ role: "user", content: "Bonjour" }]);

    expect(result).toBe("Bonjour !");
    expect(copilotQuotaService.releaseOne).not.toHaveBeenCalled();
    expect(copilotUserQuotaService.releaseOne).not.toHaveBeenCalled();
    // logUsage est fire-and-forget (void) — on laisse la microtask courante
    // s'écouler avant de vérifier l'écriture.
    await Promise.resolve();
    expect(prisma.copilotUsageLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId, userId, model: "claude-haiku-4-5-20251001" }),
      }),
    );
  });

  it("relâche le quota PAR ORGANISATION et relance l'erreur quand l'appel échoue techniquement (usesPerUserQuota=false)", async () => {
    engineChat.mockRejectedValue(new Error("Anthropic indisponible"));

    await expect(
      service.chat(organizationId, userId, false, [{ role: "user", content: "Bonjour" }]),
    ).rejects.toThrow("Anthropic indisponible");

    expect(copilotQuotaService.releaseOne).toHaveBeenCalledWith(organizationId);
    expect(copilotUserQuotaService.releaseOne).not.toHaveBeenCalled();
    expect(prisma.copilotUsageLog.create).not.toHaveBeenCalled();
  });

  it("relâche le quota PAR UTILISATEUR et relance l'erreur quand l'appel échoue techniquement (usesPerUserQuota=true)", async () => {
    engineChat.mockRejectedValue(new Error("Anthropic indisponible"));

    await expect(
      service.chat(organizationId, userId, true, [{ role: "user", content: "Bonjour" }]),
    ).rejects.toThrow("Anthropic indisponible");

    expect(copilotUserQuotaService.releaseOne).toHaveBeenCalledWith(userId);
    expect(copilotQuotaService.releaseOne).not.toHaveBeenCalled();
  });

  it("relance quand même l'erreur d'origine si la restitution elle-même échoue (jamais masquer l'échec réel)", async () => {
    engineChat.mockRejectedValue(new Error("Anthropic indisponible"));
    copilotQuotaService.releaseOne.mockRejectedValue(new Error("DB momentanément indisponible"));

    await expect(
      service.chat(organizationId, userId, false, [{ role: "user", content: "Bonjour" }]),
    ).rejects.toThrow("Anthropic indisponible");
  });

  describe("getQuotaSnapshot", () => {
    it("LAUNCH_PROGRAM : lit le quota PAR UTILISATEUR", async () => {
      prisma.subscription.findUnique.mockResolvedValue({ status: "LAUNCH_PROGRAM", copilotRequestsUsed: 0 });
      const getUsage = jest.fn().mockResolvedValue({ used: 10, limit: 700 });
      (copilotUserQuotaService as unknown as { getUsage: jest.Mock }).getUsage = getUsage;

      const snapshot = await service.getQuotaSnapshot(organizationId, userId);

      expect(getUsage).toHaveBeenCalledWith(userId);
      expect(snapshot).toEqual({ used: 10, limit: 700, remaining: 690, isLaunchProgram: true });
    });

    it("ACTIVE : lit le quota PAR ORGANISATION (copilotRequestsUsed sur la Subscription)", async () => {
      prisma.subscription.findUnique.mockResolvedValue({ status: "ACTIVE", copilotRequestsUsed: 100 });
      const getQuota = jest.fn().mockResolvedValue(500);
      (copilotQuotaService as unknown as { getQuota: jest.Mock }).getQuota = getQuota;

      const snapshot = await service.getQuotaSnapshot(organizationId, userId);

      expect(getQuota).toHaveBeenCalledWith(organizationId);
      expect(snapshot).toEqual({ used: 100, limit: 500, remaining: 400, isLaunchProgram: false });
    });
  });
});
