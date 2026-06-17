import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client";

export class FollowUpRepository {
  async findById(id: string) {
    return prisma.followUp.findUnique({
      where: { id },
      include: {
        profile: { include: { person: true } },
        assignedUser: true,
        proposal: true
      }
    });
  }

  async findAll(agencyId: string) {
    return prisma.followUp.findMany({
      where: {
        profile: { agencyId }
      },
      include: {
        profile: { include: { person: true } },
        assignedUser: true,
        proposal: true
      },
      orderBy: { dueDate: "asc" }
    });
  }

  async create(data: Prisma.FollowUpUncheckedCreateInput) {
    return prisma.followUp.create({ data });
  }

  async update(id: string, data: Prisma.FollowUpUncheckedUpdateInput) {
    return prisma.followUp.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.followUp.delete({
      where: { id }
    });
  }
}
