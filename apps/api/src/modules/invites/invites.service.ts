import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PendingInvite, Prisma, User } from '@prisma/client';
import type { PlanFeaturesJson } from '@copilote/shared';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService, AuthTokens } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { CreateInviteDto } from './dto/create-invite.dto';

const INVITE_EXPIRY_DAYS = 7;
// Une transaction Serializable en conflit avec une autre invitation créée au
// même instant échoue avec P2034 (write conflict) plutôt que de laisser les
// deux dépasser la limite de sièges — on retente simplement, la seconde
// tentative revoit un compte à jour.
const MAX_SEAT_CHECK_RETRIES = 3;

export type PendingInviteWithOrganization = PendingInvite & { organization: { name: string } };

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async create(organizationId: string, invitedByUserId: string, dto: CreateInviteDto): Promise<PendingInvite> {
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const invite = await this.createRespectingSeatLimit(organizationId, invitedByUserId, dto, expiresAt);

    const inviteUrl = `${this.configService.get<string>('CORS_ORIGIN')}/accept-invite/${invite.token}`;
    await this.mailService.sendInviteEmail(invite.email, inviteUrl, invite.organization.name);

    return invite;
  }

  /**
   * Vérifie et crée l'invitation dans une seule transaction Serializable :
   * lit le nombre d'utilisateurs + invitations en attente et n'autorise la
   * création que si le total resterait sous Plan.features.maxUsers. Sans
   * limite (TRIAL, pas de Subscription, ou maxUsers null comme Pro) :
   * illimité, comme l'essai et l'accès libre historique. Le niveau
   * Serializable fait échouer (P2034) l'une de deux invitations envoyées en
   * même temps plutôt que de laisser les deux passer sous la limite — on
   * retente alors avec un compte à jour au lieu de dépasser silencieusement.
   */
  private async createRespectingSeatLimit(
    organizationId: string,
    invitedByUserId: string,
    dto: CreateInviteDto,
    expiresAt: Date,
    attempt = 0,
  ): Promise<PendingInviteWithOrganization> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const subscription = await tx.subscription.findUnique({
            where: { organizationId },
            include: { plan: true },
          });
          const maxUsers =
            subscription?.status === 'ACTIVE'
              ? ((subscription.plan?.features as unknown as PlanFeaturesJson | null)?.maxUsers ?? null)
              : null;

          if (maxUsers !== null) {
            const [userCount, pendingInviteCount] = await Promise.all([
              tx.user.count({ where: { organizationId } }),
              tx.pendingInvite.count({
                where: { organizationId, acceptedAt: null, expiresAt: { gt: new Date() } },
              }),
            ]);

            if (userCount + pendingInviteCount >= maxUsers) {
              throw new ForbiddenException({
                message: `Limite de ${maxUsers} utilisateurs atteinte pour votre offre. Passez à une offre supérieure pour inviter plus de membres.`,
                code: 'SEAT_LIMIT_REACHED',
              });
            }
          }

          return tx.pendingInvite.create({
            data: {
              organizationId,
              email: dto.email,
              role: dto.role,
              token: randomUUID(),
              invitedByUserId,
              expiresAt,
            },
            include: { organization: { select: { name: true } } },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034' &&
        attempt < MAX_SEAT_CHECK_RETRIES
      ) {
        return this.createRespectingSeatLimit(organizationId, invitedByUserId, dto, expiresAt, attempt + 1);
      }
      throw error;
    }
  }

  findAllByOrganization(organizationId: string): Promise<PendingInvite[]> {
    return this.prisma.pendingInvite.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findValidByToken(token: string): Promise<PendingInviteWithOrganization> {
    const invite = await this.prisma.pendingInvite.findUnique({
      where: { token },
      include: { organization: { select: { name: true } } },
    });

    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new NotFoundException('Invitation introuvable ou expirée.');
    }

    return invite;
  }

  async accept(token: string, dto: AcceptInviteDto): Promise<{ user: User; tokens: AuthTokens }> {
    const invite = await this.findValidByToken(token);

    const existing = await this.prisma.user.findUnique({ where: { email: invite.email } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: invite.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: invite.role,
          organizationId: invite.organizationId,
        },
      });

      await tx.pendingInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      return created;
    });

    const tokens = await this.authService.issueTokens(user);
    return { user, tokens };
  }
}
