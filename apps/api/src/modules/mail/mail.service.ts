import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

const BRAND_COLOR = '#059669';

function layout(title: string, bodyHtml: string, ctaLabel: string, ctaUrl: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <p style="font-weight: 700; font-size: 18px; color: #111827; margin: 0 0 24px;">
        <span style="color: ${BRAND_COLOR};">UGE</span>
      </p>
      <h1 style="font-size: 20px; color: #111827; margin: 0 0 16px;">${title}</h1>
      <div style="font-size: 14px; color: #374151; line-height: 1.6; margin-bottom: 24px;">${bodyHtml}</div>
      <a href="${ctaUrl}" style="display: inline-block; background: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 20px; border-radius: 8px;">
        ${ctaLabel}
      </a>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br />
        <a href="${ctaUrl}" style="color: ${BRAND_COLOR};">${ctaUrl}</a>
      </p>
    </div>
  `;
}

/** Variante sans bouton CTA, pour un code à recopier plutôt qu'un lien à
 * cliquer (voir sendLoginVerificationCode). */
function codeLayout(title: string, bodyHtml: string, code: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <p style="font-weight: 700; font-size: 18px; color: #111827; margin: 0 0 24px;">
        <span style="color: ${BRAND_COLOR};">UGE</span>
      </p>
      <h1 style="font-size: 20px; color: #111827; margin: 0 0 16px;">${title}</h1>
      <div style="font-size: 14px; color: #374151; line-height: 1.6; margin-bottom: 24px;">${bodyHtml}</div>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: ${BRAND_COLOR}; background: #f3f4f6; text-align: center; padding: 16px; border-radius: 8px; margin: 0 0 24px;">
        ${code}
      </p>
      <p style="font-size: 12px; color: #9ca3af;">
        Ce code expire dans 10 minutes et ne peut être utilisé qu'une seule fois.
        Si vous n'êtes pas à l'origine de cette tentative, vous pouvez ignorer ce message.
      </p>
    </div>
  `;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = this.configService.get<string>('MAIL_FROM') || 'UGE <onboarding@resend.dev>';
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await this.send(
      to,
      'Réinitialisez votre mot de passe',
      layout(
        'Réinitialisez votre mot de passe',
        `Une demande de réinitialisation de mot de passe a été effectuée pour votre compte
         UGE. Ce lien est valable 1 heure. Si vous n'êtes pas à l'origine de
         cette demande, vous pouvez ignorer cet email.`,
        'Réinitialiser mon mot de passe',
        resetUrl,
      ),
    );
  }

  async sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    await this.send(
      to,
      'Confirmez votre adresse email',
      layout(
        'Confirmez votre adresse email',
        `Bienvenue sur UGE ! Confirmez votre adresse email pour vous assurer de
         ne rien manquer, notamment si vous avez besoin de réinitialiser votre mot de passe plus
         tard. Ce lien est valable 24 heures.`,
        'Confirmer mon email',
        verifyUrl,
      ),
    );
  }

  async sendLoginVerificationCode(to: string, code: string): Promise<void> {
    await this.send(
      to,
      'Votre code de connexion UGE',
      codeLayout(
        'Vérifiez votre adresse e-mail',
        `Une tentative de connexion à votre compte UGE nécessite une vérification
         supplémentaire. Saisissez le code ci-dessous pour continuer.`,
        code,
      ),
    );
  }

  async sendInviteEmail(to: string, inviteUrl: string, organizationName: string): Promise<void> {
    await this.send(
      to,
      `Invitation à rejoindre ${organizationName} sur UGE`,
      layout(
        `Vous êtes invité(e) chez ${organizationName}`,
        `Vous avez été invité(e) à rejoindre l'espace <strong>${organizationName}</strong> sur
         UGE. Ce lien est valable 7 jours.`,
        "Rejoindre l'équipe",
        inviteUrl,
      ),
    );
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`RESEND_API_KEY absent — email non envoyé (sujet : "${subject}", destinataire : ${to}).`);
      return;
    }

    const { error } = await this.resend.emails.send({ from: this.from, to, subject, html });
    if (error) {
      this.logger.error(`Échec d'envoi d'email à ${to} (sujet : "${subject}") : ${error.message}`);
    }
  }
}
