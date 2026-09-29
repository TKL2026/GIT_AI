import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

/** Réponse publique de GET /invites/:token — volontairement minimale (pas
 * d'organizationId, pas de token en retour) puisque non authentifiée. */
export class InvitePreviewDto {
  @ApiProperty()
  organizationName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: Role })
  role!: Role;
}
