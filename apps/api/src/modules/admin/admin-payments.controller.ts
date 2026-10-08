import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminProtected } from "./decorators/admin-protected.decorator";
import { AdminPaymentsQueryDto } from "./dto/admin-payments-query.dto";
import { AdminPaymentsService } from "./admin-payments.service";

@ApiTags("admin-payments")
@ApiBearerAuth()
@Controller("admin/payments")
@AdminProtected()
export class AdminPaymentsController {
  constructor(private readonly adminPaymentsService: AdminPaymentsService) {}

  @Get()
  @ApiOkResponse({
    description:
      "Liste paginée des transactions de paiement. Jamais de secrets exposés.",
  })
  list(@Query() query: AdminPaymentsQueryDto) {
    return this.adminPaymentsService.list(query);
  }
}
