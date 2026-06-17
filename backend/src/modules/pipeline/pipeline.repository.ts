import { prisma } from "../../config/prisma";
import { Prisma } from "../../generated/prisma/client";

export class PipelineRepository {
  async findByProposalId(proposalId: string) {
    return prisma.pipeline.findUnique({
      where: { proposalId },
      include: {
        proposal: true,
        history: {
          orderBy: { changedAt: 'asc' }
        }
      }
    });
  }

  async create(data: Prisma.PipelineUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      const pipeline = await tx.pipeline.create({ data });
      
      // Log initial pipeline setup
      await tx.pipelineHistory.create({
        data: {
          pipelineId: pipeline.id,
          oldStage: "NONE",
          newStage: pipeline.currentStage,
          changedBy: pipeline.updatedBy,
          notes: "Pipeline tracking initialized."
        }
      });

      return pipeline;
    });
  }

  async update(proposalId: string, data: Prisma.PipelineUncheckedUpdateInput & { oldStage: string; notes?: string }) {
    return prisma.$transaction(async (tx) => {
      const pipeline = await tx.pipeline.update({
        where: { proposalId },
        data: {
          currentStage: data.currentStage,
          updatedBy: data.updatedBy,
          stageDate: data.stageDate
        }
      });

      // Log transition event
      await tx.pipelineHistory.create({
        data: {
          pipelineId: pipeline.id,
          oldStage: data.oldStage,
          newStage: data.currentStage as string,
          changedBy: data.updatedBy as string,
          notes: data.notes || null
        }
      });

      // Update proposal status in same transaction
      const proposalStatus = data.currentStage === "CLOSED" ? "REJECTED" : "ACCEPTED";
      await tx.proposal.update({
        where: { id: proposalId },
        data: { proposalStatus }
      });

      return pipeline;
    });
  }
}