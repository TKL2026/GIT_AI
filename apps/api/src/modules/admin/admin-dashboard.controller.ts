import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminProtected } from "./decorators/admin-protected.decorator";
import { AdminDashboardService } from "./admin-dashboard.service";

@ApiTags("admin-dashboard")
@ApiBearerAuth()
@Controller("admin/dashboard")
@AdminProtected()
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get()
  @ApiOkResponse({ description: "KPIs globaux de la plateforme." })
  getStats() {
    return this.adminDashboardService.getStats();
  }
}
