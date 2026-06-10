import { PipelineRepository } from "./pipeline.repository";
import { CreatePipelineDTO, UpdatePipelineDTO } from "./pipeline.validator";

export class PipelineService {
  private repository: PipelineRepository;

  constructor() {
    this.repository = new PipelineRepository();
  }

  async createPipeline(data: CreatePipelineDTO) {
    const existing = await this.repository.findByProposalId(data.proposalId);
    if (existing) {
      throw new Error("Pipeline already exists for this proposal");
    }
    
    return this.repository.create({
      proposalId: data.proposalId,
      currentStage: data.currentStage,
      updatedBy: data.updatedBy,
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

  async updatePipeline(proposalId: string, data: UpdatePipelineDTO) {
    await this.getPipeline(proposalId); // Ensure it exists before updating
    return this.repository.update(proposalId, {
      currentStage: data.currentStage,
      updatedBy: data.updatedBy,
      stageDate: new Date() // Automatically timestamp the stage transition
    });
  }
}