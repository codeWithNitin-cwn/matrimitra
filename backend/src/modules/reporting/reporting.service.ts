import { ReportingRepository } from "./reporting.repository";

export class ReportingService {
  private repository: ReportingRepository;

  constructor() {
    this.repository = new ReportingRepository();
  }

  async getDashboardSummary(agencyId: string) {
    return this.repository.getDashboardSummary(agencyId);
  }

  async getProposalStatusReport(agencyId: string) {
    const report = await this.repository.getProposalStatusReport(agencyId);
    // Format for easier consumption on the frontend
    return report.map(item => ({
      status: item.proposalStatus,
      count: item._count.proposalStatus
    }));
  }

  async getPipelineStageReport(agencyId: string) {
    const report = await this.repository.getPipelineStageReport(agencyId);
    return report.map(item => ({
      stage: item.currentStage,
      count: item._count.currentStage
    }));
  }

  async getDetailedProfiles(agencyId: string) {
    return this.repository.getDetailedProfiles(agencyId);
  }

  async getDetailedProposals(agencyId: string) {
    return this.repository.getDetailedProposals(agencyId);
  }

  async getDetailedPipelines(agencyId: string) {
    return this.repository.getDetailedPipelines(agencyId);
  }
}