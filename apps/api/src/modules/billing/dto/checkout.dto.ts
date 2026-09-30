import { ApiProperty } from '@nestjs/swagger';
import { MobileMoneyOperator } from '@prisma/client';
import { IsEnum, IsUUID, Matches } from 'class-validator';

export class CheckoutDto {
  @ApiProperty({ description: "Identifiant du plan choisi (jamais son prix — recalculé côté serveur)." })
  @IsUUID()
  planId!: string;

  @ApiProperty({ enum: MobileMoneyOperator })
  @IsEnum(MobileMoneyOperator)
  operator!: MobileMoneyOperator;

  @ApiProperty({ example: '+237 6XX XXX XXX', description: 'Numéro Mobile Money, avec ou sans indicatif.' })
  @Matches(/^\+?\d[\d\s]{7,14}$/, { message: 'Numéro de téléphone invalide.' })
  phoneNumber!: string;
}
