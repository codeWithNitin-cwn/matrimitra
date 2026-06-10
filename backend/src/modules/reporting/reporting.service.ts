import { ReportingRepository } from "./reporting.repository";

export class ReportingService {
  private repository: ReportingRepository;

  constructor() {
    this.repository = new ReportingRepository();
  }

  async getDashboardSummary() {
    return this.repository.getDashboardSummary();
  }

  async getProposalStatusReport() {
    const report = await this.repository.getProposalStatusReport();
    // Format for easier consumption on the frontend
    return report.map(item => ({
      status: item.proposalStatus,
      count: item._count.proposalStatus
    }));
  }

  async getPipelineStageReport() {
    const report = await this.repository.getPipelineStageReport();
    return report.map(item => ({
      stage: item.currentStage,
      count: item._count.currentStage
    }));
  }
}