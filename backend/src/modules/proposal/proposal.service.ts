import { ProposalRepository } from "./proposal.repository";
import { CreateProposalDTO, AddActivityDTO } from "./proposal.validator";

export class ProposalService {
  private repository: ProposalRepository;

  constructor() {
    this.repository = new ProposalRepository();
  }

  async createProposal(data: CreateProposalDTO) {
    // Verify all related entities exist before creating the proposal
    if (!await this.repository.findAgencyById(data.senderAgencyId)) throw new Error("Sender agency not found");
    if (!await this.repository.findAgencyById(data.receiverAgencyId)) throw new Error("Receiver agency not found");
    if (!await this.repository.findProfileById(data.brideProfileId)) throw new Error("Bride profile not found");
    if (!await this.repository.findProfileById(data.groomProfileId)) throw new Error("Groom profile not found");

    const proposalNumber = `PROP-${Date.now()}`;
    const proposalStatus = "SENT"; // Initial status

    return this.repository.create({ ...data, proposalNumber, proposalStatus });
  }

  async getProposals() {
    return this.repository.findAll();
  }

  async getProposalById(id: string) {
    const proposal = await this.repository.findById(id);
    if (!proposal) {
      throw new Error("Proposal not found");
    }
    return proposal;
  }

  async acceptProposal(id: string, activityData: AddActivityDTO) {
    const proposal = await this.repository.findById(id);
    if (!proposal) throw new Error("Proposal not found");
    if (proposal.proposalStatus !== "SENT") {
      throw new Error(`Cannot accept proposal with current status: ${proposal.proposalStatus}`);
    }

    return this.repository.updateStatus(id, "ACCEPTED", {
      proposalId: id,
      activityType: "ACCEPTED",
      activityNotes: activityData.activityNotes,
      performedBy: activityData.performedBy,
    });
  }

  async rejectProposal(id: string, activityData: AddActivityDTO) {
    const proposal = await this.repository.findById(id);
    if (!proposal) throw new Error("Proposal not found");
    if (proposal.proposalStatus !== "SENT") {
      throw new Error(`Cannot reject proposal with current status: ${proposal.proposalStatus}`);
    }

    return this.repository.updateStatus(id, "REJECTED", {
      proposalId: id,
      activityType: "REJECTED",
      activityNotes: activityData.activityNotes,
      performedBy: activityData.performedBy,
    });
  }
}