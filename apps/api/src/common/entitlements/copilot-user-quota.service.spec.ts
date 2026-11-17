import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CopilotUserQuotaService,
  DEFAULT_LAUNCH_PROGRAM_COPILOT_QUOTA,
} from "./copilot-user-quota.service";

describe("CopilotUserQuotaService", () => {
  let service: CopilotUserQuotaService;
  let prisma: {
    copilotUserUsage: { upsert: jest.Mock; updateMany: jest.Mock; findUnique: jest.Mock };
  };
  let configService: { get: jest.Mock };

  const userId = "user-1";

  beforeEach(() => {
    prisma = {
      copilotUserUsage: {
        upsert: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    configService = { get: jest.fn().mockReturnValue(undefined) };
    service = new CopilotUserQuotaService(
      prisma as unknown as PrismaService,
      configService as unknown as ConfigService,
    );
  });

  describe("consumeOne", () => {
    it("crée la ligne du mois courant si absente (upsert) puis réserve atomiquement une unité", async () => {
      prisma.copilotUserUsage.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.consumeOne(userId);

      expect(result).toEqual({ allowed: true, limit: DEFAULT_LAUNCH_PROGRAM_COPILOT_QUOTA });
      expect(prisma.copilotUserUsage.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_periodKey: expect.objectContaining({ userId }) },
          create: expect.objectContaining({ userId, requestsUsed: 0 }),
          update: {},
        }),
      );
      expect(prisma.copilotUserUsage.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            requestsUsed: { lt: DEFAULT_LAUNCH_PROGRAM_COPILOT_QUOTA },
          }),
          data: { requestsUsed: { increment: 1 } },
        }),
      );
    });

    it("bloque au plafond (updateMany ne touche aucune ligne)", async () => {
      prisma.copilotUserUsage.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.consumeOne(userId);

      expect(result).toEqual({ allowed: false, limit: DEFAULT_LAUNCH_PROGRAM_COPILOT_QUOTA });
    });

    it("lit la limite depuis LAUNCH_PROGRAM_COPILOT_QUOTA quand elle est définie", async () => {
      configService.get.mockReturnValue("700");
      prisma.copilotUserUsage.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.consumeOne(userId);

      expect(result.limit).toBe(700);
    });

    it("retombe sur la valeur par défaut si la variable d'environnement est invalide", async () => {
      configService.get.mockReturnValue("pas-un-nombre");
      prisma.copilotUserUsage.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.consumeOne(userId);

      expect(result.limit).toBe(DEFAULT_LAUNCH_PROGRAM_COPILOT_QUOTA);
    });
  });

  describe("releaseOne", () => {
    it("décrémente le compteur du mois courant de façon atomique", async () => {
      prisma.copilotUserUsage.updateMany.mockResolvedValue({ count: 1 });

      await service.releaseOne(userId);

      expect(prisma.copilotUserUsage.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId, requestsUsed: { gt: 0 } }),
          data: { requestsUsed: { decrement: 1 } },
        }),
      );
    });

    it("ne fait rien (no-op) si le compteur est déjà à 0 — ne peut jamais repasser sous zéro", async () => {
      prisma.copilotUserUsage.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.releaseOne(userId)).resolves.toBeUndefined();
    });
  });

  describe("getUsage", () => {
    it("ne crée jamais de ligne (lecture seule) et renvoie 0 si aucune ligne n'existe", async () => {
      prisma.copilotUserUsage.findUnique.mockResolvedValue(null);

      const result = await service.getUsage(userId);

      expect(result).toEqual({ used: 0, limit: DEFAULT_LAUNCH_PROGRAM_COPILOT_QUOTA });
      expect(prisma.copilotUserUsage.upsert).not.toHaveBeenCalled();
    });

    it("renvoie le compteur existant", async () => {
      prisma.copilotUserUsage.findUnique.mockResolvedValue({ requestsUsed: 42 });

      const result = await service.getUsage(userId);

      expect(result.used).toBe(42);
    });
  });
});
