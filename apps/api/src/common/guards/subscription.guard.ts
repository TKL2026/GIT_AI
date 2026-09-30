import { ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { SKIP_SUBSCRIPTION_KEY } from '../decorators/skip-subscription-check.decorator';
import { isSubscriptionLocked } from '../subscription/subscription-status.util';
import { AuthenticatedUser } from '../types/authenticated-user.interface';

@Injectable()
export class SubscriptionGuard {
  private readonly logger = new Logger(SubscriptionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_SUBSCRIPTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    // Pas d'utilisateur = route @Public() (JwtAuthGuard n'a pas peuplé
    // request.user) — rien à vérifier ici, un autre garde gère déjà l'accès.
    if (!user) return true;

    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId: user.organizationId },
    });

    if (!isSubscriptionLocked(subscription)) return true;

    // Auto-guérison : bascule TRIAL -> EXPIRED en base au premier passage
    // après expiration. Compare-and-swap sur le statut (même pattern que
    // billing.service.ts#applyPaymentResult) : si un paiement concurrent a
    // déjà activé l'abonnement, cette écriture ne touche aucune ligne et ne
    // peut pas écraser un statut ACTIVE fraîchement posé.
    if (subscription?.status === 'TRIAL') {
      void this.prisma.subscription
        .updateMany({
          where: { id: subscription.id, status: 'TRIAL' },
          data: { status: 'EXPIRED' },
        })
        .catch((error) => this.logger.warn(`Échec auto-expiration essai : ${error}`));
    }

    throw new ForbiddenException({
      message:
        "Votre période d'essai est terminée. Votre espace et vos données sont conservés. Choisissez une offre pour réactiver votre accès.",
      code: 'SUBSCRIPTION_EXPIRED',
    });
  }
}
