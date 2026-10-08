import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthenticatedPlatformAdmin } from "../types/authenticated-platform-admin.interface";

export const CurrentPlatformAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedPlatformAdmin => {
    const request = ctx.switchToHttp().getRequest();
    return request.platformAdmin;
  },
);
