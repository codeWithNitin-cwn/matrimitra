import { PipelineRepository } from "./pipeline.repository";
import { CreatePipelineDTO, UpdatePipelineDTO } from "./pipeline.validator";
import { prisma } from "../../config/prisma";

export class PipelineService {
  private repository: PipelineRepository;

  constructor() {
    this.repository = new PipelineRepository();
  }

  async createPipeline(data: CreatePipelineDTO, agencyId: string, userId: string) {
    // Bug #6 fix: Verify the calling agency is a party to the proposal
    const proposal = await prisma.proposal.findUnique({
      where: { id: data.proposalId },
      include: { brideProfile: true, groomProfile: true }
    });
    if (!proposal) {
      throw new Error("Proposal not found");
    }
    if (proposal.brideProfile.status !== "ACTIVE" || proposal.groomProfile.status !== "ACTIVE") {
      throw new Error("Cannot create pipeline. Profiles must be ACTIVE");
    }
    if (proposal.senderAgencyId !== agencyId && proposal.receiverAgencyId !== agencyId) {
      throw new Error("Unauthorized: Your agency is not a party to this proposal");
    }

    const existing = await this.repository.findByProposalId(data.proposalId);
    if (existing) {
      throw new Error("Pipeline already exists for this proposal");
    }
    
    // updatedBy is pinned to JWT userId — never from client body
    return this.repository.create({
      proposalId: data.proposalId,
      currentStage: data.currentStage,
      updatedBy: userId,
      stageDate: new Date()
    });
  }

  async getPipeline(proposalId: string) {
    const pipeline = await this.repository.findByProposalId(proposalId);
    if (!pipeline) {
      throw new Error("Pipeline not found for this proposal");
    }
    return pipeline;
  }

  async updatePipeline(proposalId: string, queryingAgencyId: string, queryingUserId: string, data: UpdatePipelineDTO & { notes?: string }) {
    const existing = await this.getPipeline(proposalId); // Ensure it exists and retrieve current stage as oldStage
    
    if (!existing.proposal || (existing.proposal.senderAgencyId !== queryingAgencyId && existing.proposal.receiverAgencyId !== queryingAgencyId)) {
      throw new Error("Unauthorized: Agency is not a party to this pipeline proposal");
    }

    const PIPELINE_STAGES = [
      "PROPOSAL_SENT",
      "PROFILE_SHARED",
      "INTERESTED",
      "MEETING_SCHEDULED",
      "FAMILY_DISCUSSION",
      "ENGAGEMENT",
      "MARRIED",
      "CLOSED"
    ];

    const currentIdx = PIPELINE_STAGES.indexOf(existing.currentStage);
    const newIdx = PIPELINE_STAGES.indexOf(data.currentStage);

    if (existing.currentStage === "CLOSED" || existing.currentStage === "MARRIED") {
      throw new Error(`Invalid stage transition: Pipeline is already in terminal stage ${existing.currentStage}`);
    }

    if (newIdx !== currentIdx + 1 && data.currentStage !== "CLOSED") {
      throw new Error(`Invalid stage transition: Cannot skip stages from ${existing.currentStage} to ${data.currentStage}`);
    }

    const result = await this.repository.update(proposalId, {
      currentStage: data.currentStage,
      updatedBy: queryingUserId,
      stageDate: new Date(),
      oldStage: existing.currentStage,
      notes: data.notes
    });

    await prisma.auditLog.create({
      data: {
        agencyId: queryingAgencyId,
        userId: queryingUserId,
        entityType: "PIPELINE",
        entityId: existing.id,
        action: "STAGE_CHANGE"
      }
    });

    return result;
  }

  async getPipelineAssistant(proposalId: string, queryingAgencyId: string, runAI: boolean) {
    const pipeline = await prisma.pipeline.findUnique({
      where: { proposalId },
      include: {
        proposal: {
          include: {
            brideProfile: { include: { person: true } },
            groomProfile: { include: { person: true } }
          }
        }
      }
    });

    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    const proposal = pipeline.proposal;
    if (proposal.senderAgencyId !== queryingAgencyId && proposal.receiverAgencyId !== queryingAgencyId) {
      throw new Error("Unauthorized: Your agency is not a party to this pipeline");
    }

    const brideName = proposal.brideProfile?.person?.firstName || "Bride";
    const groomName = proposal.groomProfile?.person?.firstName || "Groom";
    const proposalStatus = proposal.proposalStatus;

    // Get compatibility score
    const compat = await prisma.compatibilityResult.findFirst({
      where: {
        OR: [
          { sourceProfileId: proposal.brideProfileId, targetProfileId: proposal.groomProfileId },
          { sourceProfileId: proposal.groomProfileId, targetProfileId: proposal.brideProfileId }
        ]
      },
      select: { compatibilityScore: true }
    });
    const compatibilityScore = compat?.compatibilityScore || 0;

    const daysInStage = Math.max(0, Math.floor((Date.now() - new Date(pipeline.stageDate).getTime()) / (1000 * 60 * 60 * 24)));

    // 1. Deterministic assistant logic
    let nextAction = "";
    let riskLevel = "LOW";
    let suggestedMessage = "";
    let expectedNextStage = "";

    // Risk rules:
    // > 3 days = MEDIUM
    // > 7 days = HIGH
    // ENGAGEMENT > 14 days = HIGH
    if (pipeline.currentStage === "ENGAGEMENT") {
      if (daysInStage > 14) {
        riskLevel = "HIGH";
      } else if (daysInStage > 7) {
        riskLevel = "MEDIUM";
      } else {
        riskLevel = "LOW";
      }
    } else {
      if (daysInStage > 7) {
        riskLevel = "HIGH";
      } else if (daysInStage > 3) {
        riskLevel = "MEDIUM";
      } else {
        riskLevel = "LOW";
      }
    }

    // stage rules:
    switch (pipeline.currentStage) {
      case "PROPOSAL_SENT":
        nextAction = "Follow up with receiving agency for proposal feedback";
        suggestedMessage = `Hi, hope you are well. Just following up on the proposal sent for ${groomName} & ${brideName}. Let us know if your client has any feedback.`;
        expectedNextStage = "PROFILE_SHARED";
        break;
      case "PROFILE_SHARED":
        nextAction = "Request feedback on the shared profile from the client";
        suggestedMessage = `Hi, hope you are doing well. Just following up on the profile of ${groomName} / ${brideName} shared with you. Let us know if you'd like to proceed further.`;
        expectedNextStage = "INTERESTED";
        break;
      case "INTERESTED":
        nextAction = "Propose convenient meeting dates to both families";
        suggestedMessage = `Hello! Both families have shown interest in proceeding. Let's schedule an initial virtual/in-person introduction. Please share a few convenient times.`;
        expectedNextStage = "MEETING_SCHEDULED";
        break;
      case "MEETING_SCHEDULED":
        nextAction = "Confirm meeting logistics and preparation";
        suggestedMessage = `Hi there. Just confirming details for the upcoming meeting scheduled for ${groomName} & ${brideName}. Let us know if you need any assistance or conversation starters.`;
        expectedNextStage = "FAMILY_DISCUSSION";
        break;
      case "FAMILY_DISCUSSION":
        nextAction = "Gather post-meeting feedback and check alignment";
        suggestedMessage = `Hello. We hope the family discussions are going well for ${groomName} & ${brideName}. Let us know if you have any updates or need clarification on any points.`;
        expectedNextStage = "ENGAGEMENT";
        break;
      case "ENGAGEMENT":
        nextAction = "Coordinate marriage preparation and close matching";
        suggestedMessage = `Congratulations on the engagement of ${groomName} & ${brideName}! We are happy to support with any final details as you move towards marriage.`;
        expectedNextStage = "MARRIED";
        break;
      case "MARRIED":
        nextAction = "Celebrate and close the pipeline";
        suggestedMessage = `Congratulations to ${groomName} & ${brideName} on their wedding! Wishing them a lifetime of happiness together.`;
        expectedNextStage = "CLOSED";
        break;
      default:
        nextAction = "Review pipeline status and next steps";
        suggestedMessage = `Hello. Just checking in on the pipeline status for ${groomName} & ${brideName}. Let us know how we can help move things forward.`;
        expectedNextStage = "CLOSED";
        break;
    }

    if (runAI) {
      const { generatePipelineAIRecommendation } = await import("../../integrations/gemini.js");
      try {
        const aiRec = await generatePipelineAIRecommendation({
          currentStage: pipeline.currentStage,
          daysInStage,
          proposalStatus,
          compatibilityScore,
          brideName,
          groomName
        });
        if (aiRec) {
          nextAction = aiRec.nextAction || nextAction;
          riskLevel = aiRec.riskLevel || riskLevel;
          suggestedMessage = aiRec.suggestedMessage || suggestedMessage;
          expectedNextStage = aiRec.expectedNextStage || expectedNextStage;
        }
      } catch (error) {
        console.error("Failed to fetch Gemini insights for pipeline, using fallback:", error);
      }
    }

    return {
      nextAction,
      riskLevel,
      suggestedMessage,
      expectedNextStage,
      daysInStage,
      compatibilityScore
    };
  }
}