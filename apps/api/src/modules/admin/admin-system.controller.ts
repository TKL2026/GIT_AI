import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminProtected } from "./decorators/admin-protected.decorator";
import { AdminSystemService } from "./admin-system.service";

@ApiTags("admin-system")
@ApiBearerAuth()
@Controller("admin/system")
@AdminProtected()
export class AdminSystemController {
  constructor(private readonly adminSystemService: AdminSystemService) {}

  @Get()
  @ApiOkResponse({
    description: "Santé générale de la plateforme (jamais de secrets).",
  })
  getStatus() {
    return this.adminSystemService.getStatus();
  }
}
