import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Product } from "@prisma/client";
import {
  formatDoualaDateLabel,
  formatDoualaMonthLabel,
  getDoualaDateString,
  getDoualaDayBoundsUtc,
  getDoualaMonthBoundsUtc,
} from "../../common/time/douala-time.util";
import { computeStockStatus } from "../../common/stock/stock-status.util";
import { PrismaService } from "../../prisma/prisma.service";
import { FinanceService } from "../finance/finance.service";
import { DailyReportListItemDto } from "./dto/daily-report-list-item.dto";
import { DailyReportResponseDto } from "./dto/daily-report-response.dto";
import { MonthlyReportResponseDto } from "./dto/monthly-report-response.dto";
import { StockAlertItemDto } from "./dto/stock-alert-item.dto";

const MAX_TOP_PRODUCTS = 5;
// Borne la plage de la liste journalière pour éviter une requête non
// bornée (voir section 4 de la demande) — pas de nouvel index ajouté tant
// que le volume réel d'une PME ne le justifie pas.
const MAX_LIST_RANGE_DAYS = 366;

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
  ) {}

  async getDailyReport(
    organizationId: string,
    date?: string,
  ): Promise<DailyReportResponseDto> {
    const reportDate = date ?? getDoualaDateString();
    const organizationName = await this.getOrganizationName(organizationId);
    const { startUtc, endUtc } = getDoualaDayBoundsUtc(reportDate);

    const [summary, productsProfitability, stockAlerts] = await Promise.all([
      this.financeService.getSummary(
        organizationId,
        startUtc.toISOString(),
        endUtc.toISOString(),
      ),
      this.financeService.getProductsProfitability(
        organizationId,
        startUtc.toISOString(),
        endUtc.toISOString(),
      ),
      this.getStockAlertsAsOf(organizationId, endUtc),
    ]);

    return {
      date: reportDate,
      dateLabel: formatDoualaDateLabel(reportDate),
      organizationName,
      hasActivity: summary.salesCount > 0,
      totalRevenue: summary.totalRevenue,
      totalExpenses: summary.totalExpenses,
      totalCogs: summary.totalCogs,
      grossMargin: summary.grossMargin,
      netProfit: summary.netProfit,
      salesCount: summary.salesCount,
      topProducts: productsProfitability.slice(0, MAX_TOP_PRODUCTS),
      stockAlerts,
    };
  }

  /**
   * Une seule requête sur toute la plage demandée, regroupée en mémoire
   * par jour civil Africa/Douala — pas une requête par jour (voir section
   * 4 de la demande : éviter les requêtes répétitives).
   */
  async getDailyReportsList(
    organizationId: string,
    from: string,
    to: string,
  ): Promise<DailyReportListItemDto[]> {
    await this.getOrganizationName(organizationId);

    if (from > to) {
      throw new BadRequestException(
        "'from' doit être antérieur ou égal à 'to'.",
      );
    }
    const rangeDays = this.countDaysInclusive(from, to);
    if (rangeDays > MAX_LIST_RANGE_DAYS) {
      throw new BadRequestException(
        `La période demandée dépasse la limite de ${MAX_LIST_RANGE_DAYS} jours.`,
      );
    }

    const { startUtc } = getDoualaDayBoundsUtc(from);
    const { endUtc } = getDoualaDayBoundsUtc(to);

    const sales = await this.prisma.sale.findMany({
      where: {
        organizationId,
        createdAt: { gte: startUtc, lt: endUtc },
      },
      select: { createdAt: true, totalAmount: true },
    });

    const byDate = new Map<string, { totalRevenue: number; salesCount: number }>();
    for (const sale of sales) {
      const dateKey = getDoualaDateString(sale.createdAt);
      const entry = byDate.get(dateKey) ?? { totalRevenue: 0, salesCount: 0 };
      entry.totalRevenue += Number(sale.totalAmount);
      entry.salesCount += 1;
      byDate.set(dateKey, entry);
    }

    const items: DailyReportListItemDto[] = [];
    for (let i = 0; i < rangeDays; i += 1) {
      const dateKey = this.addDays(from, i);
      const entry = byDate.get(dateKey);
      items.push({
        date: dateKey,
        dateLabel: formatDoualaDateLabel(dateKey),
        totalRevenue: entry?.totalRevenue ?? 0,
        salesCount: entry?.salesCount ?? 0,
        hasActivity: (entry?.salesCount ?? 0) > 0,
      });
    }

    // Du plus récent au plus ancien, comme demandé.
    return items.reverse();
  }

  async getMonthlyReport(
    organizationId: string,
    month?: string,
  ): Promise<MonthlyReportResponseDto> {
    const reportMonth = month ?? getDoualaDateString().slice(0, 7);
    const organizationName = await this.getOrganizationName(organizationId);
    const { startUtc, endUtc } = getDoualaMonthBoundsUtc(reportMonth);

    const [summary, productsProfitability, stockAlerts] = await Promise.all([
      this.financeService.getSummary(
        organizationId,
        startUtc.toISOString(),
        endUtc.toISOString(),
      ),
      this.financeService.getProductsProfitability(
        organizationId,
        startUtc.toISOString(),
        endUtc.toISOString(),
      ),
      this.getStockAlertsAsOf(organizationId, endUtc),
    ]);

    return {
      month: reportMonth,
      monthLabel: formatDoualaMonthLabel(reportMonth),
      organizationName,
      hasActivity: summary.salesCount > 0,
      totalRevenue: summary.totalRevenue,
      totalExpenses: summary.totalExpenses,
      totalCogs: summary.totalCogs,
      grossMargin: summary.grossMargin,
      netProfit: summary.netProfit,
      salesCount: summary.salesCount,
      topProducts: productsProfitability.slice(0, MAX_TOP_PRODUCTS),
      stockAlerts,
    };
  }

  private async getOrganizationName(organizationId: string): Promise<string> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });
    if (!organization) {
      throw new NotFoundException("Organisation introuvable.");
    }
    return organization.name;
  }

  /**
   * Alertes stock à une date passée, reconstruites à partir de l'historique
   * réel des mouvements (StockMovement) — jamais le stock *actuel* du
   * produit (anomalie QA #2 : un rapport du 26 octobre affichait une
   * alerte apparue seulement le 28). `StockMovement` enregistre déjà
   * `previousQuantity`/`newQuantity` à chaque mouvement, donc aucune
   * nouvelle historisation à construire — seulement l'utiliser correctement :
   *
   * - Dernier mouvement du produit avant `asOfExclusiveUtc` trouvé → son
   *   `newQuantity` est la quantité à cette date.
   * - Aucun mouvement avant cette date, mais le produit en a eu plus tard →
   *   `previousQuantity` du tout premier mouvement (valeur constante depuis
   *   la création jusqu'à ce premier mouvement).
   * - Le produit n'a jamais eu le moindre mouvement → `stockQuantity`
   *   courant est fiable (il n'a jamais changé depuis la création).
   *
   * Limite assumée et documentée : le seuil `minStock` utilisé est le
   * seuil ACTUEL du produit, pas un éventuel seuil historique — les seuils
   * eux-mêmes ne sont pas historisés dans ce projet. Approximation
   * raisonnable (les seuils changent rarement), très nettement plus
   * correcte que l'ancien comportement (stock actuel affiché comme
   * historique), sans construire un second système d'historisation pour
   * les seuils uniquement pour ce correctif.
   */
  private async getStockAlertsAsOf(
    organizationId: string,
    asOfExclusiveUtc: Date,
  ): Promise<StockAlertItemDto[]> {
    const products = await this.prisma.product.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
    if (products.length === 0) return [];

    const movements = await this.prisma.stockMovement.findMany({
      where: { organizationId },
      select: {
        productId: true,
        createdAt: true,
        previousQuantity: true,
        newQuantity: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const movementsByProduct = new Map<string, typeof movements>();
    for (const movement of movements) {
      const list = movementsByProduct.get(movement.productId) ?? [];
      list.push(movement);
      movementsByProduct.set(movement.productId, list);
    }

    return products.flatMap((product) => {
      const productMovements = movementsByProduct.get(product.id) ?? [];
      const quantityAsOf = this.resolveHistoricalQuantity(
        product,
        productMovements,
        asOfExclusiveUtc,
      );
      const status = computeStockStatus(quantityAsOf, product.minStock);
      if (status === "ok") return [];
      return [
        {
          productId: product.id,
          productName: product.name,
          stockQuantity: quantityAsOf,
          minStock: product.minStock,
          status,
        },
      ];
    });
  }

  private resolveHistoricalQuantity(
    product: Product,
    movements: {
      createdAt: Date;
      previousQuantity: number;
      newQuantity: number;
    }[],
    asOfExclusiveUtc: Date,
  ): number {
    let lastBefore: (typeof movements)[number] | undefined;
    for (const movement of movements) {
      if (movement.createdAt < asOfExclusiveUtc) {
        lastBefore = movement;
      } else {
        break; // trié par createdAt croissant : rien d'utile après
      }
    }
    if (lastBefore) return lastBefore.newQuantity;
    // Aucun mouvement avant cette date : soit le tout premier mouvement
    // (plus tard) donne la quantité constante depuis la création...
    if (movements.length > 0) return movements[0].previousQuantity;
    // ...soit il n'y a jamais eu le moindre mouvement : la quantité
    // courante n'a jamais changé depuis la création du produit.
    return product.stockQuantity;
  }

  private countDaysInclusive(from: string, to: string): number {
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toDate = new Date(`${to}T00:00:00.000Z`);
    return Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1;
  }

  private addDays(dateString: string, days: number): string {
    const date = new Date(`${dateString}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }
}
