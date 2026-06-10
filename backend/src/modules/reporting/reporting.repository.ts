import { prisma } from "../../config/prisma";

export class ReportingRepository {
  async getDashboardSummary() {
    const totalAgencies = await prisma.agency.count();
    const totalProfiles = await prisma.agencyProfile.count();
    const totalProposals = await prisma.proposal.count();

    const acceptedProposals = await prisma.proposal.count({
      where: { proposalStatus: "ACCEPTED" },
    });

    const rejectedProposals = await prisma.proposal.count({
      where: { proposalStatus: "REJECTED" },
    });

    const activePipelines = await prisma.pipeline.count({
      where: {
        NOT: {
          currentStage: { in: ["MARRIED", "CLOSED"] },
        },
      },
    });

    return {
      totalAgencies,
      totalProfiles,
      totalProposals,
      acceptedProposals,
      rejectedProposals,
      activePipelines,
    };
  }

  async getProposalStatusReport() {
    return prisma.proposal.groupBy({ by: ["proposalStatus"], _count: { proposalStatus: true } });
  }

  async getPipelineStageReport() {
    return prisma.pipeline.groupBy({ by: ["currentStage"], _count: { currentStage: true } });
  }
}