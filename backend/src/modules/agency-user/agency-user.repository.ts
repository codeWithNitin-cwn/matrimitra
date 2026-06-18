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

  async findAll(agencyId: string) {
    return prisma.agencyUser.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" }
    });
  }

  async findById(id: string, agencyId: string) {
    return prisma.agencyUser.findFirst({
      where: { id, agencyId }
    });
  }

  async update(id: string, agencyId: string, data: Prisma.AgencyUserUncheckedUpdateInput) {
    return prisma.agencyUser.update({
      where: { id, agencyId },
      data
    });
  }
}