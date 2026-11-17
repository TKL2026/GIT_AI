import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { CopilotQuotaGuard } from "../../common/guards/copilot-quota.guard";
import { AuthenticatedUser } from "../../common/types/authenticated-user.interface";
import { CopilotService } from "./copilot.service";
import { ChatRequestDto } from "./dto/chat-request.dto";
import { ChatResponseDto } from "./dto/chat-response.dto";
import { CopilotQuotaResponseDto } from "./dto/copilot-quota-response.dto";

@ApiTags("copilot")
@ApiBearerAuth()
@Roles(Role.OWNER, Role.ADMIN, Role.DIRECTOR)
@Controller("copilot")
export class CopilotController {
  constructor(private readonly copilotService: CopilotService) {}

  @Post("chat")
  @UseGuards(CopilotQuotaGuard)
  @ApiOkResponse({ type: ChatResponseDto })
  async chat(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    const message = await this.copilotService.chat(
      currentUser.organizationId,
      currentUser.userId,
      currentUser.copilotQuotaMechanism === "per-user",
      dto.messages,
    );
    return { message };
  }

  // Lecture seule, jamais derrière CopilotQuotaGuard : consulter son quota
  // ne doit jamais en consommer une unité.
  @Get("quota")
  @ApiOkResponse({ type: CopilotQuotaResponseDto })
  async quota(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<CopilotQuotaResponseDto> {
    return this.copilotService.getQuotaSnapshot(
      currentUser.organizationId,
      currentUser.userId,
    );
  }
}
