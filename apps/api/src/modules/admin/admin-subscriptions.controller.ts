import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminProtected } from "./decorators/admin-protected.decorator";
import { AdminSubscriptionsQueryDto } from "./dto/admin-subscriptions-query.dto";
import { AdminSubscriptionsService } from "./admin-subscriptions.service";

@ApiTags("admin-subscriptions")
@ApiBearerAuth()
@Controller("admin/subscriptions")
@AdminProtected()
export class AdminSubscriptionsController {
  constructor(
    private readonly adminSubscriptionsService: AdminSubscriptionsService,
  ) {}

  @Get()
  @ApiOkResponse({
    description:
      "Liste paginée des abonnements, toutes organisations confondues.",
  })
  list(@Query() query: AdminSubscriptionsQueryDto) {
    return this.adminSubscriptionsService.list(query);
  }
}
