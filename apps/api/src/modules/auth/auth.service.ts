import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Plan, Role, User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { createHash, randomUUID } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { UsersService } from "../users/users.service";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
  organizationId: string;
  jti: string;
}

const RESET_TOKEN_EXPIRY_MINUTES = 60;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException("Un compte existe déjà avec cet email.");
    }

    // Offre payante choisie avant l'inscription : le frontend ne transmet
    // qu'un code, jamais un prix — on revérifie ici qu'il correspond à un
    // Plan actif réel avant de faire quoi que ce soit (source de vérité).
    let chosenPlan: Plan | null = null;
    if (dto.planCode) {
      chosenPlan = await this.prisma.plan.findUnique({
        where: { code: dto.planCode },
      });
      if (!chosenPlan || !chosenPlan.isActive) {
        throw new NotFoundException("Offre introuvable ou inactive.");
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName?.trim() || "Mon entreprise",
          onboardingStep: "company",
        },
      });

      const createdUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: Role.OWNER,
          organizationId: organization.id,
        },
      });

      if (chosenPlan) {
        // Offre payante : aucun essai de 7 jours accordé — bloqué jusqu'à
        // confirmation d'un paiement réel (voir isSubscriptionLocked).
        await tx.subscription.create({
          data: {
            organizationId: organization.id,
            planId: chosenPlan.id,
            status: "AWAITING_PAYMENT",
          },
        });
      } else {
        // Essai gratuit de 7 jours, démarré automatiquement à l'inscription.
        const now = new Date();
        await tx.subscription.create({
          data: {
            organizationId: organization.id,
            status: "TRIAL",
            startedAt: now,
            currentPeriodEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      }

      return createdUser;
    });

    const tokens = await this.issueTokens(user);
    // Vérification "douce" : part en tâche de fond, ne retarde jamais la
    // réponse d'inscription (sendVerificationLink avale ses propres erreurs,
    // donc pas de risque de rejet de promesse non capturé ici).
    void this.sendVerificationLink(user);
    return { user, tokens };
  }

  async login(dto: LoginDto): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("Identifiants invalides.");
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException("Identifiants invalides.");
    }

    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  /**
   * Connexion sans mot de passe, réservée aux audits temporaires. Toujours
   * le même compte démo pré-configuré (jamais un compte au choix de
   * l'appelant) — réutilise issueTokens() pour que la session résultante
   * soit scopée à l'organisation du compte démo exactement comme une
   * connexion normale, sans logique d'isolation multi-tenant séparée à
   * maintenir. Renvoie 404 si désactivé, pour ne pas révéler que la route
   * existe.
   */
  async demoLogin(): Promise<{ user: User; tokens: AuthTokens }> {
    const isEnabled =
      this.configService.get<string>("DEMO_MODE_ENABLED") === "true";
    if (!isEnabled) {
      throw new NotFoundException();
    }

    const demoEmail =
      this.configService.get<string>("DEMO_USER_EMAIL") || "owner@demo.com";
    const user = await this.usersService.findByEmail(demoEmail);
    if (!user) {
      throw new NotFoundException();
    }

    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
        },
      );
    } catch {
      throw new UnauthorizedException("Refresh token invalide ou expiré.");
    }

    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, tokenHash, revoked: false },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token invalide ou expiré.");
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException("Utilisateur introuvable.");
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    return this.issueTokens(user);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash, revoked: false },
      data: { revoked: true },
    });
  }

  /**
   * Ne révèle jamais si l'email correspond à un compte existant (évite
   * l'énumération de comptes) : renvoie toujours sans erreur.
   *
   * Le lien est toujours journalisé (utile pour retrouver/renvoyer un lien
   * manuellement) et envoyé par email si RESEND_API_KEY est configuré —
   * sinon MailService se contente de journaliser l'absence d'envoi.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return;
    }

    const token = randomUUID();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(
          Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000,
        ),
      },
    });

    const resetUrl = `${this.configService.get<string>("CORS_ORIGIN")}/reset-password?token=${token}`;
    this.logger.log(
      `Lien de réinitialisation pour ${user.email} : ${resetUrl}`,
    );
    await this.mailService.sendPasswordResetEmail(user.email, resetUrl);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new NotFoundException(
        "Lien de réinitialisation invalide ou expiré.",
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Un mot de passe réinitialisé invalide toute session déjà ouverte —
      // notamment utile si la réinitialisation fait suite à un compte compromis.
      this.prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, revoked: false },
        data: { revoked: true },
      }),
    ]);
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const verificationToken =
      await this.prisma.emailVerificationToken.findUnique({
        where: { token: dto.token },
      });

    if (
      !verificationToken ||
      verificationToken.usedAt ||
      verificationToken.expiresAt < new Date()
    ) {
      throw new NotFoundException("Lien de confirmation invalide ou expiré.");
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  /** Renvoie un lien à l'utilisateur authentifié courant (jamais à un email
   * arbitraire — évite tout abus d'envoi en masse). Ne fait rien si le
   * compte est déjà vérifié. */
  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || user.emailVerifiedAt) {
      return;
    }
    await this.sendVerificationLink(user);
  }

  /** N'échoue jamais : une erreur d'envoi ne doit pas casser l'inscription
   * ni la demande de renvoi (le lien reste de toute façon journalisé). */
  private async sendVerificationLink(user: User): Promise<void> {
    try {
      const token = randomUUID();
      await this.prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(
            Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
          ),
        },
      });

      const verifyUrl = `${this.configService.get<string>("CORS_ORIGIN")}/verify-email?token=${token}`;
      this.logger.log(
        `Lien de confirmation d'email pour ${user.email} : ${verifyUrl}`,
      );
      await this.mailService.sendVerificationEmail(user.email, verifyUrl);
    } catch (error) {
      this.logger.error(
        `Échec de préparation de l'email de confirmation pour ${user.email}`,
        error,
      );
    }
  }

  /** Public : réutilisé par InvitesService pour connecter automatiquement un
   * utilisateur invité après acceptation, sans dupliquer la logique de
   * signature/hash de token. */
  async issueTokens(user: User): Promise<AuthTokens> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      jti: randomUUID(),
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
      expiresIn: this.configService.get<string>("JWT_ACCESS_EXPIRES_IN"),
    });

    const refreshExpiresIn = this.configService.get<string>(
      "JWT_REFRESH_EXPIRES_IN",
    )!;
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: refreshExpiresIn,
    });

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: this.computeExpiryDate(refreshExpiresIn),
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private computeExpiryDate(expiresIn: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    const value = Number(match[1]);
    const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[
      match[2]
    ]!;
    return new Date(Date.now() + value * unitMs);
  }
}
