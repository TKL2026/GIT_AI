import { Role } from "@prisma/client";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
  organizationId: string;
  /** Posé par CopilotQuotaGuard pour que CopilotController/CopilotService
   * sachent quel mécanisme de quota a été consommé (et donc lequel relâcher
   * en cas d'échec technique) sans refaire la même lecture de Subscription.
   * Absent sur toute route non gardée par CopilotQuotaGuard. */
  copilotQuotaMechanism?: "org" | "per-user";
}
