import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminProtected } from "./decorators/admin-protected.decorator";
import { AdminAuditLogService } from "./admin-audit-log.service";
import { PaginationQueryDto } from "./dto/pagination-query.dto";

@ApiTags("admin-audit-logs")
@ApiBearerAuth()
@Controller("admin/audit-logs")
@AdminProtected()
export class AdminAuditLogsController {
  constructor(private readonly adminAuditLogService: AdminAuditLogService) {}

  @Get()
  @ApiOkResponse({
    description: "Journal append-only des actions administratives.",
  })
  list(@Query() query: PaginationQueryDto) {
    return this.adminAuditLogService.list({
      page: query.page,
      pageSize: query.pageSize,
    });
  }
}
