import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminProtected } from "./decorators/admin-protected.decorator";
import { AdminUsersQueryDto } from "./dto/admin-users-query.dto";
import { AdminUsersService } from "./admin-users.service";

@ApiTags("admin-users")
@ApiBearerAuth()
@Controller("admin/users")
@AdminProtected()
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOkResponse({
    description:
      "Liste paginée des utilisateurs, toutes organisations confondues.",
  })
  list(@Query() query: AdminUsersQueryDto) {
    return this.adminUsersService.list(query);
  }

  @Get(":id")
  @ApiOkResponse({ description: "Détail d'un utilisateur." })
  getDetail(@Param("id") id: string) {
    return this.adminUsersService.getDetail(id);
  }
}
