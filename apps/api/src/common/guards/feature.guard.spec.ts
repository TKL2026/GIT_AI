import { FEATURES } from '@copilote/shared';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { FeatureGuard } from './feature.guard';

function buildContext(user: Record<string, unknown> | undefined): ExecutionContext {
  return {
    getHandler: () => 'handler',
    getClass: () => 'class',
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('FeatureGuard', () => {
  let entitlementsService: { hasFeature: jest.Mock };
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: FeatureGuard;

  const fakeUser = { userId: 'user-1', email: 'a@b.com', role: 'OWNER', organizationId: 'org-1' };

  beforeEach(() => {
    entitlementsService = { hasFeature: jest.fn() };
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) };
    guard = new FeatureGuard(reflector as unknown as Reflector, entitlementsService as unknown as EntitlementsService);
  });

  it("laisse passer sans même consulter les entitlements si l'endpoint n'a pas de @RequireFeature", async () => {
    const result = await guard.canActivate(buildContext(fakeUser));
    expect(result).toBe(true);
    expect(entitlementsService.hasFeature).not.toHaveBeenCalled();
  });

  it('laisse passer une route @Public() (pas de request.user)', async () => {
    reflector.getAllAndOverride.mockReturnValue(FEATURES.FORECAST);
    const result = await guard.canActivate(buildContext(undefined));
    expect(result).toBe(true);
    expect(entitlementsService.hasFeature).not.toHaveBeenCalled();
  });

  it("laisse passer quand l'organisation possède la fonctionnalité requise", async () => {
    reflector.getAllAndOverride.mockReturnValue(FEATURES.FORECAST);
    entitlementsService.hasFeature.mockResolvedValue(true);

    const result = await guard.canActivate(buildContext(fakeUser));

    expect(result).toBe(true);
    expect(entitlementsService.hasFeature).toHaveBeenCalledWith('org-1', FEATURES.FORECAST);
  });

  it("bloque (403, code FEATURE_NOT_INCLUDED) quand l'organisation n'a pas la fonctionnalité requise", async () => {
    reflector.getAllAndOverride.mockReturnValue(FEATURES.WHATSAPP);
    entitlementsService.hasFeature.mockResolvedValue(false);

    await expect(guard.canActivate(buildContext(fakeUser))).rejects.toMatchObject({
      constructor: ForbiddenException,
      response: { code: 'FEATURE_NOT_INCLUDED', feature: FEATURES.WHATSAPP },
    });
  });
});
