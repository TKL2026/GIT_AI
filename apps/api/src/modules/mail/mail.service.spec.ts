import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

const sendMock = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}));

function buildService(values: Record<string, string>): MailService {
  const configService = { get: (key: string) => values[key] } as unknown as ConfigService;
  return new MailService(configService);
}

describe('MailService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sans RESEND_API_KEY', () => {
    it("ne tente pas d'envoyer et ne lève pas d'erreur", async () => {
      const service = buildService({});

      await expect(
        service.sendPasswordResetEmail('user@test.com', 'https://app.test/reset-password?token=abc'),
      ).resolves.toBeUndefined();
      expect(sendMock).not.toHaveBeenCalled();
    });
  });

  describe('avec RESEND_API_KEY', () => {
    it('envoie un email de réinitialisation au bon destinataire', async () => {
      sendMock.mockResolvedValue({ data: {}, error: null });
      const service = buildService({ RESEND_API_KEY: 'test-key' });

      await service.sendPasswordResetEmail('user@test.com', 'https://app.test/reset-password?token=abc');

      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'user@test.com', subject: 'Réinitialisez votre mot de passe' }),
      );
    });

    it("envoie un email d'invitation mentionnant le nom de l'organisation", async () => {
      sendMock.mockResolvedValue({ data: {}, error: null });
      const service = buildService({ RESEND_API_KEY: 'test-key' });

      await service.sendInviteEmail('user@test.com', 'https://app.test/accept-invite/abc', 'Boutique Test');

      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'user@test.com', subject: expect.stringContaining('Boutique Test') }),
      );
    });

    it("envoie un email de confirmation d'adresse", async () => {
      sendMock.mockResolvedValue({ data: {}, error: null });
      const service = buildService({ RESEND_API_KEY: 'test-key' });

      await service.sendVerificationEmail('user@test.com', 'https://app.test/verify-email?token=abc');

      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'user@test.com', subject: 'Confirmez votre adresse email' }),
      );
    });

    it("ne lève pas d'erreur si Resend renvoie une erreur (seulement journalisée)", async () => {
      sendMock.mockResolvedValue({ data: null, error: { message: 'bad request' } });
      const service = buildService({ RESEND_API_KEY: 'test-key' });

      await expect(
        service.sendPasswordResetEmail('user@test.com', 'https://app.test/reset-password?token=abc'),
      ).resolves.toBeUndefined();
    });
  });
});
