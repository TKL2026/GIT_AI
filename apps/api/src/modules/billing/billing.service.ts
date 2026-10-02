import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import {
  Plan,
  Prisma,
  PaymentTransaction,
  Subscription,
  SubscriptionPeriod,
} from "@prisma/client";
import { randomUUID } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { CamPayService } from "../campay/campay.service";
import { CheckoutDto } from "./dto/checkout.dto";
import { normalizeCameroonPhone } from "./phone.util";

const PERIOD_DURATIONS_MS: Record<SubscriptionPeriod, number> = {
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
  YEARLY: 365 * 24 * 60 * 60 * 1000,
};

/** Forme normalisée de l'événement CamPay, qu'il vienne du webhook (POST) ou
 * d'une vérification active de statut (GET /transaction/{reference}/) — un
 * seul point d'entrée (`applyPaymentResult`) traite les deux à l'identique. */
interface CamPayPaymentResult {
  reference: string;
  externalReference: string;
  status: string;
  amount: string | number;
  currency: string;
}

export interface CheckoutResult {
  transactionId: string;
  externalReference: string;
  ussdCode: string | null;
  status: string;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly camPayService: CamPayService,
  ) {}

  listPlans(): Promise<Plan[]> {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
  }

  async getSubscription(
    organizationId: string,
  ): Promise<(Subscription & { plan: Plan | null }) | null> {
    return this.prisma.subscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    });
  }

  listTransactions(organizationId: string): Promise<PaymentTransaction[]> {
    return this.prisma.paymentTransaction.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Crée une tentative de paiement et appelle CamPay. Le prix et la devise
   * viennent exclusivement du Plan en base — jamais du corps de la requête.
   */
  async checkout(
    organizationId: string,
    dto: CheckoutDto,
  ): Promise<CheckoutResult> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan || !plan.isActive) {
      throw new NotFoundException("Plan introuvable ou inactif.");
    }

    const phoneNumber = normalizeCameroonPhone(dto.phoneNumber);
    const externalReference = `uge_${randomUUID()}`;

    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        organizationId,
        planId: plan.id,
        amount: plan.price,
        currency: plan.currency,
        provider: "CAMPAY",
        operator: dto.operator,
        phoneNumber,
        status: "PENDING",
        externalReference,
      },
    });

    try {
      const result = await this.camPayService.collect({
        amount: plan.price,
        currency: plan.currency,
        from: phoneNumber,
        description: `Abonnement UGE — ${plan.name}`,
        externalReference,
      });

      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { providerReference: result.reference },
      });

      return {
        transactionId: transaction.id,
        externalReference,
        ussdCode: result.ussdCode,
        status: "PENDING",
      };
    } catch (error) {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED", providerStatusRaw: "collect_call_failed" },
      });
      throw error;
    }
  }

  /**
   * Statut d'une transaction, borné à l'organisation de l'appelant (isolation
   * multi-tenant). Si encore PENDING, revérifie activement auprès de CamPay
   * en filet de sécurité — utile si le webhook n'est jamais arrivé.
   */
  async getTransactionForOrganization(
    organizationId: string,
    externalReference: string,
  ): Promise<PaymentTransaction> {
    const transaction = await this.prisma.paymentTransaction.findFirst({
      where: { externalReference, organizationId },
    });
    if (!transaction) {
      throw new NotFoundException("Transaction introuvable.");
    }

    if (transaction.status !== "PENDING" || !transaction.providerReference) {
      return transaction;
    }

    try {
      const remote = await this.camPayService.getTransactionStatus(
        transaction.providerReference,
      );
      await this.applyPaymentResult({
        reference: remote.reference,
        externalReference: transaction.externalReference,
        status: remote.status,
        amount: remote.amount,
        currency: remote.currency,
      });
    } catch (error) {
      this.logger.warn(
        `Revérification CamPay impossible pour ${transaction.externalReference} : ${(error as Error).message}`,
      );
    }

    return (
      (await this.prisma.paymentTransaction.findUnique({
        where: { id: transaction.id },
      })) ?? transaction
    );
  }

  /**
   * Point d'entrée unique pour tout résultat de paiement appris de CamPay
   * (webhook ou reconciliation active) — idempotent : un même
   * external_reference déjà traité (statut != PENDING) est ignoré sans
   * aucun effet de bord, quel que soit le nombre d'appels.
   */
  async applyPaymentResult(event: CamPayPaymentResult): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.paymentTransaction.findUnique({
        where: { externalReference: event.externalReference },
        include: { plan: true },
      });

      if (!transaction) {
        this.logger.warn(
          `Événement CamPay ignoré : aucune transaction pour external_reference=${event.externalReference}`,
        );
        return;
      }

      if (transaction.status !== "PENDING") {
        this.logger.log(
          `Événement CamPay ignoré : transaction ${transaction.id} déjà traitée (statut=${transaction.status}).`,
        );
        return;
      }

      // CamPay documente explicitement PENDING comme statut intermédiaire
      // (le client n'a pas encore répondu à l'invite USSD sur son téléphone)
      // — ce n'est PAS un échec, juste "pas encore décidé". La revérification
      // active (getTransactionForOrganization) peut recevoir ce statut avant
      // que le webhook final n'arrive : ne rien modifier, un appel ultérieur
      // (webhook ou nouvelle revérification) tranchera avec un statut final.
      if (event.status === "PENDING") {
        return;
      }

      const amountMatches = Number(event.amount) === transaction.amount;
      const currencyMatches = event.currency === transaction.currency;
      const referenceMatches =
        !transaction.providerReference ||
        transaction.providerReference === event.reference;

      if (!amountMatches || !currencyMatches || !referenceMatches) {
        this.logger.error(
          `Événement CamPay rejeté pour incohérence (transaction ${transaction.id}) : ` +
            `montant OK=${amountMatches}, devise OK=${currencyMatches}, référence OK=${referenceMatches}`,
        );
        await tx.paymentTransaction.updateMany({
          where: { id: transaction.id, status: "PENDING" },
          data: {
            status: "FAILED",
            providerStatusRaw: "mismatch",
            providerReference: event.reference,
          },
        });
        return;
      }

      const isSuccess = event.status === "SUCCESSFUL";

      // Verrou d'idempotence sous concurrence : n'agit que si encore PENDING
      // au moment précis de l'écriture (et pas seulement au moment de la
      // lecture ci-dessus) — deux webhooks simultanés pour la même
      // transaction ne peuvent aboutir qu'à une seule activation.
      const updated = await tx.paymentTransaction.updateMany({
        where: { id: transaction.id, status: "PENDING" },
        data: {
          status: isSuccess ? "SUCCESS" : "FAILED",
          providerReference: event.reference,
          providerStatusRaw: event.status,
          paidAt: isSuccess ? new Date() : null,
        },
      });

      if (updated.count === 0 || !isSuccess) {
        return;
      }

      await this.activateSubscription(tx, transaction, transaction.plan);
    });
  }

  private async activateSubscription(
    tx: Prisma.TransactionClient,
    transaction: PaymentTransaction,
    plan: Plan,
  ): Promise<void> {
    const existing = await tx.subscription.findUnique({
      where: { organizationId: transaction.organizationId },
    });

    const now = new Date();
    const periodMs = PERIOD_DURATIONS_MS[plan.period];

    // Prolonge depuis la fin de la période en cours si l'abonnement est
    // encore actif et pas encore expiré — ne jamais écraser une période déjà
    // payée. Sinon (premier abonnement, ou renouvellement tardif après
    // expiration), la nouvelle période repart de maintenant.
    const stillActive =
      existing?.status === "ACTIVE" &&
      existing.currentPeriodEnd &&
      existing.currentPeriodEnd > now;
    const baseDate = stillActive ? existing!.currentPeriodEnd! : now;
    const newPeriodEnd = new Date(baseDate.getTime() + periodMs);

    // Chaque paiement réussi (premier abonnement, renouvellement, ou
    // changement de plan) remet le compteur de requêtes Copilot à zéro —
    // c'est le même événement qui fait à la fois foi pour la période de
    // facturation (currentPeriodEnd) et pour le quota, pas de champ de
    // période séparé nécessaire. Pendant un essai (jamais renouvelé via ce
    // chemin), le compteur n'est donc jamais remis à zéro ici.
    const subscription = await tx.subscription.upsert({
      where: { organizationId: transaction.organizationId },
      create: {
        organizationId: transaction.organizationId,
        planId: plan.id,
        status: "ACTIVE",
        startedAt: now,
        currentPeriodEnd: newPeriodEnd,
        copilotRequestsUsed: 0,
      },
      update: {
        planId: plan.id,
        status: "ACTIVE",
        startedAt: existing?.startedAt ?? now,
        currentPeriodEnd: newPeriodEnd,
        cancelledAt: null,
        copilotRequestsUsed: 0,
      },
    });

    await tx.paymentTransaction.update({
      where: { id: transaction.id },
      data: { subscriptionId: subscription.id },
    });
  }
}
