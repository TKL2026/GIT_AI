import { Controller, Post, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { CopilotService } from '../copilot/copilot.service';
import { SendMessageResponseDto } from './dto/send-message-response.dto';
import { toWhatsAppText } from './markdown-to-whatsapp';
import { WhatsAppService } from './whatsapp.service';

@ApiTags('whatsapp')
@ApiBearerAuth()
@Roles(Role.OWNER, Role.ADMIN, Role.DIRECTOR)
@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly copilotService: CopilotService,
    private readonly configService: ConfigService,
  ) {}

  @Post('send-test')
  @ApiCreatedResponse({ type: SendMessageResponseDto })
  async sendTest(): Promise<SendMessageResponseDto> {
    const recipient = this.getRecipient();
    const messageId = await this.whatsAppService.sendTemplate(recipient, 'hello_world');
    return { messageId };
  }

  @Post('send-daily-report')
  @ApiCreatedResponse({ type: SendMessageResponseDto })
  async sendDailyReport(@CurrentUser() currentUser: AuthenticatedUser): Promise<SendMessageResponseDto> {
    const recipient = this.getRecipient();
    const report = await this.copilotService.generateDailyReport(currentUser.organizationId);
    const messageId = await this.whatsAppService.sendText(recipient, toWhatsAppText(report));
    return { messageId };
  }

  private getRecipient(): string {
    const recipient = this.configService.get<string>('WHATSAPP_NOTIFICATION_RECIPIENT');
    if (!recipient) {
      throw new ServiceUnavailableException(
        "Aucun destinataire WhatsApp configuré (WHATSAPP_NOTIFICATION_RECIPIENT manquant).",
      );
    }
    return recipient;
  }
}
