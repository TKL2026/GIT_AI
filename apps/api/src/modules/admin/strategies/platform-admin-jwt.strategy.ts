import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthenticatedPlatformAdmin } from "../../../common/types/authenticated-platform-admin.interface";

interface PlatformAdminTokenPayload {
  sub: string;
  email: string;
  type: "platform_admin";
}

/**
 * Stratégie Passport nommée ('jwt-platform-admin'), distincte de la
 * stratégie par défaut 'jwt' utilisée par les comptes d'organisation
 * (JwtStrategy). Secret différent (JWT_PLATFORM_ADMIN_SECRET) : un token
 * tenant ne peut structurellement jamais être validé ici, et réciproquement.
 */
@Injectable()
export class PlatformAdminJwtStrategy extends PassportStrategy(
  Strategy,
  "jwt-platform-admin",
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_PLATFORM_ADMIN_SECRET")!,
    });
  }

  validate(payload: PlatformAdminTokenPayload): AuthenticatedPlatformAdmin {
    // Défense en profondeur : même si le secret dédié rend déjà impossible la
    // réutilisation d'un token tenant ici, on revérifie explicitement la
    // nature du token.
    if (payload.type !== "platform_admin") {
      throw new UnauthorizedException();
    }
    return { platformAdminId: payload.sub, email: payload.email };
  }
}
