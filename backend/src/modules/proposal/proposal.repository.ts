import { prisma } from "../../config/prisma";
import { Prisma } from "../../generated/prisma/client";

export class ProposalRepository {
  // Methods to verify existence of related entities
  async findAgencyById(id: string) {
    return prisma.agency.findUnique({ where: { id } });
  }

  async findProfileById(id: string) {
    return prisma.agencyProfile.findUnique({ where: { id } });
  }

  // Proposal methods
  async create(proposalData: Prisma.ProposalUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      const proposal = await tx.proposal.create({
        data: proposalData,
      });
      // Log the creation event
      await tx.proposalActivity.create({
        data: {
          proposalId: proposal.id,
          activityType: "CREATED",
          activityNotes: "Proposal created and sent.",
          performedBy: proposal.createdBy,
        },
      });
      return proposal;
    });
  }

  async findAll() {
    return prisma.proposal.findMany({
      include: {
        senderAgency: { select: { name: true } },
        receiverAgency: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.proposal.findUnique({
      where: { id },
      include: {
        senderAgency: true,
        receiverAgency: true,
        brideProfile: { include: { person: true } },
        groomProfile: { include: { person: true } },
        activities: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async updateStatus(id: string, status: string, activity: Prisma.ProposalActivityUncheckedCreateInput) {
    await prisma.proposal.update({ where: { id }, data: { proposalStatus: status } });
    return prisma.proposalActivity.create({ data: activity });
  }
}