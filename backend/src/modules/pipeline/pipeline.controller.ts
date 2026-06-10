import { Request, Response } from "express";
import { PipelineService } from "./pipeline.service";
import { createPipelineSchema, updatePipelineSchema } from "./pipeline.validator";

const pipelineService = new PipelineService();

export class PipelineController {
  async createPipeline(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = createPipelineSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ") }
        });
        return;
      }
      const pipeline = await pipelineService.createPipeline(validationResult.data);
      res.status(201).json({ success: true, data: pipeline });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create pipeline";
      res.status(409).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async getPipelineByProposalId(req: Request, res: Response): Promise<void> {
    try {
      const { proposalId } = req.params;
      const pipeline = await pipelineService.getPipeline(proposalId);
      res.status(200).json({ success: true, data: pipeline });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch pipeline";
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message } });
    }
  }

  async updatePipelineStage(req: Request, res: Response): Promise<void> {
    try {
      const { proposalId } = req.params;
      const validationResult = updatePipelineSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ") }
        });
        return;
      }
      const pipeline = await pipelineService.updatePipeline(proposalId, validationResult.data);
      res.status(200).json({ success: true, data: pipeline });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update pipeline";
      res.status(409).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }
}