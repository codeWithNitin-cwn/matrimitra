import { prisma } from "../../config/prisma";
import { Prisma } from "../../generated/prisma/client";

export class AgencyUserRepository {
  async findByEmail(email: string) {
    return prisma.agencyUser.findUnique({ where: { email } });
  }

  async findByUsername(username: string) {
    return prisma.agencyUser.findUnique({ where: { username } });
  }

  async create(data: Prisma.AgencyUserUncheckedCreateInput) {
    return prisma.agencyUser.create({ data });
  }
}