import { prisma } from "../../config/prisma";
import { Prisma } from "../../generated/prisma/client";

export class QuestionRepository {
  async create(data: Prisma.QuestionCreateInput) {
    return prisma.question.create({ data, include: { options: true } });
  }

  async findAll() {
    // Find all active questions alongside their available options
    return prisma.question.findMany({ where: { isActive: true }, include: { options: true } });
  }
}