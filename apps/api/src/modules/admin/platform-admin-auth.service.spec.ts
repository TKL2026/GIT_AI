import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditLogService } from './admin-audit-log.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { PlatformAdminAuthService } from './platform-admin-auth.service';

describe('PlatformAdminAuthService', () => {
  let service: PlatformAdminAuthService;
  let prisma: {
    platformAdmin: { findUnique: jest.Mock; findById?: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };
  let configService: { get: jest.Mock };
  let auditLogService: { record: jest.Mock };

  const dto: AdminLoginDto = { email: 'admin@uge.pro', password: 'CorrectHorse123!' };

  beforeEach(() => {
    prisma = {
      platformAdmin: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<void>) =>
        callback({ platformAdmin: { update: jest.fn() } }),
      ),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };
    configService = {
      get: jest.fn((key: string) =>
        key === 'JWT_PLATFORM_ADMIN_SECRET' ? 'secret' : key === 'JWT_PLATFORM_ADMIN_EXPIRES_IN' ? '8h' : undefined,
      ),
    };
    auditLogService = { record: jest.fn().mockResolvedValue(undefined) };

    service = new PlatformAdminAuthService(
      prisma as unknown as PrismaService,
      jwtService as any,
      configService as any,
      auditLogService as unknown as AdminAuditLogService,
    );
  });

  describe('login', () => {
    it('refuse un email inconnu avec un message générique (anti-énumération)', async () => {
      prisma.platformAdmin.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toMatchObject({
        constructor: UnauthorizedException,
        message: 'Identifiants invalides.',
      });
    });

    it('refuse un compte désactivé avec le même message générique', async () => {
      prisma.platformAdmin.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: dto.email,
        passwordHash: await bcrypt.hash(dto.password, 10),
        isActive: false,
      });

      await expect(service.login(dto)).rejects.toMatchObject({
        constructor: UnauthorizedException,
        message: 'Identifiants invalides.',
      });
    });

    it('refuse un mot de passe incorrect', async () => {
      prisma.platformAdmin.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: dto.email,
        passwordHash: await bcrypt.hash('AutreChose123!', 10),
        isActive: true,
      });

      await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('connecte un admin actif avec le bon mot de passe, journalise et renvoie un token signé avec le secret dédié', async () => {
      const admin = {
        id: 'admin-1',
        email: dto.email,
        firstName: 'Awa',
        lastName: 'Diallo',
        passwordHash: await bcrypt.hash(dto.password, 10),
        isActive: true,
      };
      prisma.platformAdmin.findUnique.mockResolvedValue(admin);

      const result = await service.login(dto);

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.admin).toBe(admin);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'admin-1', email: dto.email, type: 'platform_admin' }),
        expect.objectContaining({ secret: 'secret', expiresIn: '8h' }),
      );
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('journalise une entrée admin.login dans la même transaction que la mise à jour lastLoginAt', async () => {
      const admin = {
        id: 'admin-1',
        email: dto.email,
        passwordHash: await bcrypt.hash(dto.password, 10),
        isActive: true,
      };
      prisma.platformAdmin.findUnique.mockResolvedValue(admin);

      await service.login(dto);

      expect(auditLogService.record).toHaveBeenCalledWith(
        { platformAdminId: 'admin-1', action: 'admin.login' },
        expect.anything(),
      );
    });
  });
});
