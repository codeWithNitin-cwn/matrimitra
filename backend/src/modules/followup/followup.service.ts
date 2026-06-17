import { FollowUpRepository } from "./followup.repository.js";
import { CreateFollowUpDTO, UpdateFollowUpDTO } from "./followup.validator.js";

export class FollowUpService {
  private repository: FollowUpRepository;

  constructor() {
    this.repository = new FollowUpRepository();
  }

  async getFollowUps(agencyId: string) {
    return this.repository.findAll(agencyId);
  }

  async getFollowUpById(id: string, agencyId: string) {
    const log = await this.repository.findById(id);
    if (!log) throw new Error("Follow-up not found");
    if (log.profile.agencyId !== agencyId) {
      throw new Error("Unauthorized access to follow-up");
    }
    return log;
  }

  async createFollowUp(data: CreateFollowUpDTO, agencyId: string) {
    return this.repository.create({
      profileId: data.profileId,
      proposalId: data.proposalId || null,
      assignedUserId: data.assignedUserId,
      dueDate: new Date(data.dueDate),
      priority: data.priority,
      notes: data.notes || null,
      status: "PENDING"
    });
  }

  async updateFollowUp(id: string, data: UpdateFollowUpDTO, agencyId: string) {
    const existing = await this.getFollowUpById(id, agencyId);
    return this.repository.update(id, {
      priority: data.priority,
      status: data.status,
      notes: data.notes,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined
    });
  }

  async deleteFollowUp(id: string, agencyId: string) {
    await this.getFollowUpById(id, agencyId);
    return this.repository.delete(id);
  }

  async markComplete(id: string, agencyId: string) {
    await this.getFollowUpById(id, agencyId);
    return this.repository.update(id, { status: "COMPLETED" });
  }
}
