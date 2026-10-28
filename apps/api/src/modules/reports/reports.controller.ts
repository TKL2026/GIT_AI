import { Controller, Get, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { FEATURES } from "@copilote/shared";
import type { Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequireFeature } from "../../common/decorators/require-feature.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthenticatedUser } from "../../common/types/authenticated-user.interface";
import { DailyReportListItemDto } from "./dto/daily-report-list-item.dto";
import { DailyReportQueryDto } from "./dto/daily-report-query.dto";
import { DailyReportResponseDto } from "./dto/daily-report-response.dto";
import { DailyReportsListQueryDto } from "./dto/daily-reports-list-query.dto";
import { MonthlyReportQueryDto } from "./dto/monthly-report-query.dto";
import { MonthlyReportResponseDto } from "./dto/monthly-report-response.dto";
import { buildDailyReportPdf, buildMonthlyReportPdf } from "./reports-pdf.builder";
import { ReportsService } from "./reports.service";

@ApiTags("reports")
@ApiBearerAuth()
@Roles(Role.OWNER, Role.ADMIN, Role.DIRECTOR)
@RequireFeature(FEATURES.REPORTS_STANDARD)
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("daily")
  @ApiOkResponse({ type: DailyReportResponseDto })
  getDailyReport(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DailyReportQueryDto,
  ): Promise<DailyReportResponseDto> {
    return this.reportsService.getDailyReport(
      currentUser.organizationId,
      query.date,
    );
  }

  @Get("daily/list")
  @ApiOkResponse({ type: [DailyReportListItemDto] })
  getDailyReportsList(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DailyReportsListQueryDto,
  ): Promise<DailyReportListItemDto[]> {
    return this.reportsService.getDailyReportsList(
      currentUser.organizationId,
      query.from,
      query.to,
    );
  }

  /**
   * Génération à la demande, jamais stockée (section 4 de la demande) —
   * réponse brute hors de l'enveloppe JSON habituelle (TransformInterceptor
   * ne sait pas sérialiser un binaire), même précédent que
   * WhatsAppWebhookController pour une réponse @Res() directe.
   */
  @Get("daily/pdf")
  async getDailyReportPdf(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: DailyReportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const report = await this.reportsService.getDailyReport(
      currentUser.organizationId,
      query.date,
    );
    const pdf = await buildDailyReportPdf(report);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="UGE_Rapport_Journalier_${report.date}.pdf"`,
      "Content-Length": pdf.length,
    });
    res.send(pdf);
  }

  @Get("monthly")
  @ApiOkResponse({ type: MonthlyReportResponseDto })
  getMonthlyReport(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: MonthlyReportQueryDto,
  ): Promise<MonthlyReportResponseDto> {
    return this.reportsService.getMonthlyReport(
      currentUser.organizationId,
      query.month,
    );
  }

  @Get("monthly/pdf")
  async getMonthlyReportPdf(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: MonthlyReportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const report = await this.reportsService.getMonthlyReport(
      currentUser.organizationId,
      query.month,
    );
    const pdf = await buildMonthlyReportPdf(report);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="UGE_Rapport_Mensuel_${report.month}.pdf"`,
      "Content-Length": pdf.length,
    });
    res.send(pdf);
  }
}
