import { prisma } from "../../config/prisma";
import { Prisma } from "../../generated/prisma/client";

export class PipelineRepository {
  async findByProposalId(proposalId: string) {
    return prisma.pipeline.findUnique({ where: { proposalId } });
  }

  async create(data: Prisma.PipelineUncheckedCreateInput) {
    return prisma.pipeline.create({ data });
  }

  async update(proposalId: string, data: Prisma.PipelineUncheckedUpdateInput) {
    return prisma.pipeline.update({
      where: { proposalId },
      data
    });
  }
}