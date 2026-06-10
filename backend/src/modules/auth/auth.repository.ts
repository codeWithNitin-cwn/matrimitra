import { prisma } from "../../config/prisma";
import type { AgencyUser } from "../../generated/prisma/client";

export class AuthRepository {
  async findUserByEmail(email: string): Promise<AgencyUser | null> {
    return prisma.agencyUser.findUnique({
      where: { email },
    });
  }
}