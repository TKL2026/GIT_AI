import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { CopilotService } from './copilot.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { DailyReportResponseDto } from './dto/daily-report-response.dto';

@ApiTags('copilot')
@ApiBearerAuth()
@Roles(Role.OWNER, Role.ADMIN, Role.DIRECTOR)
@Controller('copilot')
export class CopilotController {
  constructor(private readonly copilotService: CopilotService) {}

  @Post('chat')
  @ApiOkResponse({ type: ChatResponseDto })
  async chat(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    const message = await this.copilotService.chat(currentUser.organizationId, dto.messages);
    return { message };
  }

  @Get('daily-report')
  @ApiOkResponse({ type: DailyReportResponseDto })
  async dailyReport(@CurrentUser() currentUser: AuthenticatedUser): Promise<DailyReportResponseDto> {
    const report = await this.copilotService.generateDailyReport(currentUser.organizationId);
    return { report };
  }
}
