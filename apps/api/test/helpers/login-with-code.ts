import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MailService } from '../../src/modules/mail/mail.service';

/**
 * Connexion complète (identifiants + code de vérification par email) pour
 * les tests e2e d'autres modules qui ont seulement besoin d'un accessToken
 * valide pour un rôle donné — intercepte le code réellement envoyé via
 * MailService (sans jamais court-circuiter l'étape de vérification
 * elle-même : le flux HTTP réel /auth/login -> /auth/verify-login-code est
 * entièrement exercé, comme pour un vrai utilisateur).
 */
export async function loginAndGetAccessToken(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const mailService = app.get(MailService);
  const codeSpy = jest.spyOn(mailService, 'sendLoginVerificationCode');

  const loginResponse = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });

  const { challengeToken } = loginResponse.body.data;
  const call = codeSpy.mock.calls.find(([to]) => to === email);
  const code = call?.[1];
  codeSpy.mockRestore();

  const verifyResponse = await request(app.getHttpServer())
    .post('/api/auth/verify-login-code')
    .send({ challengeToken, code });

  return verifyResponse.body.data.accessToken;
}
