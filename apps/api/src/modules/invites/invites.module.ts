import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';
import { OrganizationInvitesController } from './organization-invites.controller';

@Module({
  imports: [AuthModule, MailModule],
  controllers: [InvitesController, OrganizationInvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}
