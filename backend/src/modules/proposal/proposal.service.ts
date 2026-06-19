import { ProposalRepository } from "./proposal.repository";
import { CreateProposalDTO, AddActivityDTO } from "./proposal.validator";
import { prisma } from "../../config/prisma";
import { PipelineService } from "../pipeline/pipeline.service";

export class ProposalService {
  private repository: ProposalRepository;
  private pipelineService: PipelineService;

  constructor() {
    this.repository = new ProposalRepository();
    this.pipelineService = new PipelineService();
  }

  async createProposal(data: CreateProposalDTO, agencyId: string, userId: string) {
    // Verify all related entities exist before creating the proposal
    if (!await this.repository.findAgencyById(agencyId)) throw new Error("Sender agency not found");
    if (!await this.repository.findAgencyById(data.receiverAgencyId)) throw new Error("Receiver agency not found");
    const brideProfile = await this.repository.findProfileById(data.brideProfileId);
    if (!brideProfile) throw new Error("Bride profile not found");
    if (brideProfile.status !== "ACTIVE") throw new Error("Bride profile is not ACTIVE");

    const groomProfile = await this.repository.findProfileById(data.groomProfileId);
    if (!groomProfile) throw new Error("Groom profile not found");
    if (groomProfile.status !== "ACTIVE") throw new Error("Groom profile is not ACTIVE");

    // Validate profile types and genders
    if (brideProfile.profileType.toUpperCase() !== "BRIDE") {
      throw new Error("Invalid proposal: Bride profile must have profileType of BRIDE");
    }
    if (groomProfile.profileType.toUpperCase() !== "GROOM") {
      throw new Error("Invalid proposal: Groom profile must have profileType of GROOM");
    }
    if ((brideProfile as any).person?.gender?.toUpperCase() !== "FEMALE") {
      throw new Error("Invalid proposal: Bride profile must belong to a person of FEMALE gender");
    }
    if ((groomProfile as any).person?.gender?.toUpperCase() !== "MALE") {
      throw new Error("Invalid proposal: Groom profile must belong to a person of MALE gender");
    }

    if (data.brideProfileId === data.groomProfileId) {
      throw new Error("Invalid proposal: Bride and Groom profiles cannot be the same");
    }

    const isInternal = brideProfile.agencyId === groomProfile.agencyId;
    const matchType = isInternal ? "INTERNAL" : "CROSS_AGENCY";

    if (!isInternal) {
      const isBrideOwnerSender = brideProfile.agencyId === agencyId;
      const isBrideOwnerReceiver = brideProfile.agencyId === data.receiverAgencyId;
      const isGroomOwnerSender = groomProfile.agencyId === agencyId;
      const isGroomOwnerReceiver = groomProfile.agencyId === data.receiverAgencyId;

      const validPairing = (isBrideOwnerSender && isGroomOwnerReceiver) || (isGroomOwnerSender && isBrideOwnerReceiver);
      if (!validPairing) {
        throw new Error("Invalid proposal: One profile must belong to the sender agency and the other to the receiver agency. Third-party profiles are not allowed.");
      }
    } else {
      if (brideProfile.agencyId !== agencyId || groomProfile.agencyId !== agencyId || data.receiverAgencyId !== agencyId) {
        throw new Error("Invalid proposal: For internal proposals, both profiles must belong to your agency and receiver agency must match sender agency.");
      }
    }

    const activeProposal = await prisma.proposal.findFirst({
      where: {
        brideProfileId: data.brideProfileId,
        groomProfileId: data.groomProfileId,
        proposalStatus: { in: ["SENT", "PENDING", "ACCEPTED"] }
      }
    });
    if (activeProposal) {
      throw new Error("Invalid proposal: An active proposal already exists between these profiles");
    }

    const proposalNumber = `PROP-${Date.now()}`;
    const proposalStatus = "SENT"; // Initial status

    // senderAgencyId and createdBy are pinned to the JWT-authenticated user — never from client body
    return this.repository.create({ ...data, senderAgencyId: agencyId, createdBy: userId, proposalNumber, proposalStatus, matchType });
  }

  async getProposals(agencyId: string) {
    const proposals = await this.repository.findAll(agencyId);
    for (const proposal of proposals) {
      const isUnlocked = proposal.proposalStatus === "ACCEPTED" && proposal.brideAccepted === true && proposal.groomAccepted === true;
      if (!isUnlocked) {
        if (proposal.brideProfile && proposal.brideProfile.agencyId !== agencyId && proposal.brideProfile.person) {
          proposal.brideProfile.person.email = "Hidden until proposal acceptance";
          proposal.brideProfile.person.mobile = "Hidden until proposal acceptance";
        }
        if (proposal.groomProfile && proposal.groomProfile.agencyId !== agencyId && proposal.groomProfile.person) {
          proposal.groomProfile.person.email = "Hidden until proposal acceptance";
          proposal.groomProfile.person.mobile = "Hidden until proposal acceptance";
        }
      }
    }
    return proposals;
  }

  async getProposalById(id: string, queryingAgencyId: string) {
    const proposal = await this.repository.findById(id);
    if (!proposal) {
      throw new Error("Proposal not found");
    }
    // Privacy lock: mask email/mobile of cross-agency client profiles if proposal is not accepted
    const isUnlocked = proposal.proposalStatus === "ACCEPTED" && proposal.brideAccepted === true && proposal.groomAccepted === true;
    if (!isUnlocked) {
      if (proposal.brideProfile && proposal.brideProfile.agencyId !== queryingAgencyId && proposal.brideProfile.person) {
        proposal.brideProfile.person.email = "Hidden until proposal acceptance";
        proposal.brideProfile.person.mobile = "Hidden until proposal acceptance";
      }
      if (proposal.groomProfile && proposal.groomProfile.agencyId !== queryingAgencyId && proposal.groomProfile.person) {
        proposal.groomProfile.person.email = "Hidden until proposal acceptance";
        proposal.groomProfile.person.mobile = "Hidden until proposal acceptance";
      }
    }
    return proposal;
  }

  async acceptProposal(id: string, queryingAgencyId: string, queryingUserId: string, activityData: AddActivityDTO) {
    const proposal = await this.repository.findById(id);
    if (!proposal) throw new Error("Proposal not found");
    if (proposal.receiverAgencyId !== queryingAgencyId) {
      throw new Error("Unauthorized: Proposal belongs to another agency");
    }
    if (proposal.proposalStatus !== "SENT") {
      throw new Error(`Cannot accept proposal with current status: ${proposal.proposalStatus}`);
    }

    // Run everything in a single transaction
    return prisma.$transaction(async (tx) => {
      // 1. Update proposal status
      await tx.proposal.update({
        where: { id },
        data: {
          proposalStatus: "ACCEPTED",
          brideAccepted: true,
          groomAccepted: true
        }
      });

      // 2. Create proposal activity record
      const activity = await tx.proposalActivity.create({
        data: {
          proposalId: id,
          activityType: "ACCEPTED",
          activityNotes: activityData.activityNotes,
          performedBy: queryingUserId,
        }
      });

      // 3. Create pipeline record (and verify constraints)
      const fullProposal = await tx.proposal.findUnique({
        where: { id },
        include: { brideProfile: true, groomProfile: true }
      });
      if (!fullProposal) {
        throw new Error("Proposal not found");
      }
      if (fullProposal.brideProfile.status !== "ACTIVE" || fullProposal.groomProfile.status !== "ACTIVE") {
        throw new Error("Cannot create pipeline. Profiles must be ACTIVE");
      }

      const existingPipeline = await tx.pipeline.findUnique({
        where: { proposalId: id }
      });
      if (!existingPipeline) {
        await tx.pipeline.create({
          data: {
            proposalId: id,
            currentStage: "PROFILE_SHARED",
            updatedBy: queryingUserId,
            stageDate: new Date()
          }
        });
      }

      // 4. Log audit event
      await tx.auditLog.create({
        data: {
          agencyId: queryingAgencyId,
          userId: queryingUserId,
          entityType: "PROPOSAL",
          entityId: id,
          action: "ACCEPT"
        }
      });

      return activity;
    });
  }

  async rejectProposal(id: string, queryingAgencyId: string, queryingUserId: string, activityData: AddActivityDTO) {
    const proposal = await this.repository.findById(id);
    if (!proposal) throw new Error("Proposal not found");
    if (proposal.receiverAgencyId !== queryingAgencyId) {
      throw new Error("Unauthorized: Proposal belongs to another agency");
    }
    if (proposal.proposalStatus !== "SENT") {
      throw new Error(`Cannot reject proposal with current status: ${proposal.proposalStatus}`);
    }

    const result = await this.repository.updateStatus(id, "REJECTED", {
      proposalId: id,
      activityType: "REJECTED",
      activityNotes: activityData.activityNotes,
      performedBy: queryingUserId,
    });

    await prisma.auditLog.create({
      data: {
        agencyId: queryingAgencyId,
        userId: queryingUserId,
        entityType: "PROPOSAL",
        entityId: id,
        action: "REJECT"
      }
    });

    return result;
  }
}