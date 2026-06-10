import { prisma } from "../../config/prisma";
import { Prisma } from "../../generated/prisma/client";

export class AgencyRepository {
  async findByCode(agencyCode: string) {
    return prisma.agency.findUnique({ where: { agencyCode } });
  }

  async findByEmail(email: string) {
    return prisma.agency.findUnique({ where: { email } });
  }

  async create(data: Prisma.AgencyCreateInput) {
    return prisma.agency.create({ data });
  }
}