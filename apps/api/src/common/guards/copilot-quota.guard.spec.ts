import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CopilotQuotaService } from '../entitlements/copilot-quota.service';
import { CopilotQuotaGuard } from './copilot-quota.guard';

function buildContext(user: Record<string, unknown> | undefined): ExecutionContext {
  return {
    getHandler: () => 'handler',
    getClass: () => 'class',
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('CopilotQuotaGuard', () => {
  let copilotQuotaService: { consumeOne: jest.Mock };
  let guard: CopilotQuotaGuard;

  const fakeUser = { userId: 'user-1', email: 'a@b.com', role: 'OWNER', organizationId: 'org-1' };

  beforeEach(() => {
    copilotQuotaService = { consumeOne: jest.fn() };
    guard = new CopilotQuotaGuard(copilotQuotaService as unknown as CopilotQuotaService);
  });

  it('laisse passer une route @Public() (pas de request.user) sans consulter le quota', async () => {
    const result = await guard.canActivate(buildContext(undefined));
    expect(result).toBe(true);
    expect(copilotQuotaService.consumeOne).not.toHaveBeenCalled();
  });

  it("laisse passer et consomme une unité quand il reste du quota", async () => {
    copilotQuotaService.consumeOne.mockResolvedValue({ allowed: true, limit: 500 });

    const result = await guard.canActivate(buildContext(fakeUser));

    expect(result).toBe(true);
    expect(copilotQuotaService.consumeOne).toHaveBeenCalledWith('org-1');
  });

  it('bloque (403, code COPILOT_QUOTA_EXCEEDED) quand le quota est atteint', async () => {
    copilotQuotaService.consumeOne.mockResolvedValue({ allowed: false, limit: 500 });

    await expect(guard.canActivate(buildContext(fakeUser))).rejects.toMatchObject({
      constructor: ForbiddenException,
      response: { code: 'COPILOT_QUOTA_EXCEEDED' },
    });
  });
});
