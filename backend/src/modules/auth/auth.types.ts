import type { UserRole } from "../../generated/prisma/client";

export interface JwtPayload {
  id: string;
  agencyId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}