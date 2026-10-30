import { ApiProperty } from "@nestjs/swagger";

/** Réponse de POST /auth/login et /auth/resend-login-code — ne contient
 * jamais de jeton de session réel, uniquement une référence à la demande
 * de vérification en cours (voir AuthService#verifyLoginCode). */
export class LoginChallengeResponseDto {
  @ApiProperty()
  challengeToken!: string;

  @ApiProperty()
  expiresInSeconds!: number;

  @ApiProperty()
  resendAvailableInSeconds!: number;
}
