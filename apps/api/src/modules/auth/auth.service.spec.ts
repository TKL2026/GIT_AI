import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: {
    $transaction: jest.Mock;
    refreshToken: { create: jest.Mock; findFirst: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
    organization: { create: jest.Mock };
    user: { create: jest.Mock };
  };
  let usersService: { findByEmail: jest.Mock; findById: jest.Mock };
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let configService: { get: jest.Mock };

  const fakeUser = {
    id: 'user-1',
    email: 'owner@demo.com',
    passwordHash: '',
    firstName: 'Demo',
    lastName: 'Owner',
    role: Role.OWNER,
    organizationId: 'org-1',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    fakeUser.passwordHash = await bcrypt.hash('Password123!', 10);

    prisma = {
      $transaction: jest.fn(async (cb) =>
        cb({
          organization: { create: jest.fn().mockResolvedValue({ id: 'org-1', name: 'Boutique' }) },
          user: { create: jest.fn().mockResolvedValue(fakeUser) },
        }),
      ),
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      organization: { create: jest.fn() },
      user: { create: jest.fn() },
    };

    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
      verifyAsync: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret',
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_ACCESS_EXPIRES_IN: '15m',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return values[key];
      }),
    };

    authService = new AuthService(
      prisma as unknown as PrismaService,
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  describe('register', () => {
    it('crée une organisation et un utilisateur OWNER puis retourne des tokens', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await authService.register({
        organizationName: 'Boutique',
        email: 'owner@demo.com',
        password: 'Password123!',
        firstName: 'Demo',
        lastName: 'Owner',
      });

      expect(result.user).toEqual(fakeUser);
      expect(result.tokens.accessToken).toBe('signed-token');
      expect(result.tokens.refreshToken).toBe('signed-token');
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it("lève une ConflictException si l'email existe déjà", async () => {
      usersService.findByEmail.mockResolvedValue(fakeUser);

      await expect(
        authService.register({
          organizationName: 'Boutique',
          email: 'owner@demo.com',
          password: 'Password123!',
          firstName: 'Demo',
          lastName: 'Owner',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('retourne des tokens si les identifiants sont corrects', async () => {
      usersService.findByEmail.mockResolvedValue(fakeUser);

      const result = await authService.login({
        email: 'owner@demo.com',
        password: 'Password123!',
      });

      expect(result.user).toEqual(fakeUser);
      expect(result.tokens.accessToken).toBe('signed-token');
    });

    it('lève une UnauthorizedException si le mot de passe est incorrect', async () => {
      usersService.findByEmail.mockResolvedValue(fakeUser);

      await expect(
        authService.login({ email: 'owner@demo.com', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("lève une UnauthorizedException si l'utilisateur n'existe pas", async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'unknown@demo.com', password: 'Password123!' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
