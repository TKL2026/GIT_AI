import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PendingInvite, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService, AuthTokens } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { CreateInviteDto } from './dto/create-invite.dto';

const INVITE_EXPIRY_DAYS = 7;

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
    const invite = await this.prisma.pendingInvite.create({
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

    const inviteUrl = `${this.configService.get<string>('CORS_ORIGIN')}/accept-invite/${invite.token}`;
    await this.mailService.sendInviteEmail(invite.email, inviteUrl, invite.organization.name);

    return invite;
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
