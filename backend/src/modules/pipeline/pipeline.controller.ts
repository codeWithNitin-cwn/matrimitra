import { Request, Response } from "express";
import { PipelineService } from "./pipeline.service";
import { createPipelineSchema, updatePipelineSchema } from "./pipeline.validator";

const pipelineService = new PipelineService();

export class PipelineController {
  async createPipeline(req: Request, res: Response): Promise<void> {
    try {
      const agencyId = (req as any).user?.agencyId;
      const userId = (req as any).user?.id;
      if (!agencyId || !userId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }
      const validationResult = createPipelineSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ") }
        });
        return;
      }
      // agencyId and userId come from JWT — not from client body
      const pipeline = await pipelineService.createPipeline(validationResult.data, agencyId, userId);
      res.status(201).json({ success: true, data: pipeline });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create pipeline";
      res.status(409).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async getPipelineByProposalId(req: Request, res: Response): Promise<void> {
    try {
      const { proposalId } = req.params;
      if (typeof proposalId !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid proposal ID format" } });
        return;
      }
      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }
      const pipeline = await pipelineService.getPipeline(proposalId, agencyId);
      res.status(200).json({ success: true, data: pipeline });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch pipeline";
      if (message.includes("Unauthorized")) {
        res.status(403).json({ success: false, error: { code: "FORBIDDEN", message } });
        return;
      }
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message } });
    }
  }

  async updatePipelineStage(req: Request, res: Response): Promise<void> {
    try {
      const { proposalId } = req.params;
      if (typeof proposalId !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid proposal ID format" } });
        return;
      }
      const validationResult = updatePipelineSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ") }
        });
        return;
      }
      const agencyId = (req as any).user?.agencyId;
      const userId = (req as any).user?.id;
      if (!agencyId || !userId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }
      const pipelineData = { ...validationResult.data, updatedBy: userId };
      const pipeline = await pipelineService.updatePipeline(proposalId, agencyId, userId, pipelineData);
      res.status(200).json({ success: true, data: pipeline });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update pipeline";
      res.status(409).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async getPipelineAssistant(req: Request, res: Response): Promise<void> {
    try {
      const { proposalId } = req.params;
      if (typeof proposalId !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid proposal ID format" } });
        return;
      }
      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }
      const runAI = req.query.ai === "true";
      const recommendation = await pipelineService.getPipelineAssistant(proposalId, agencyId, runAI);
      res.status(200).json({ success: true, data: recommendation });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch pipeline assistant recommendation";
      res.status(450).json({ success: false, error: { code: "ASSISTANT_ERROR", message } });
    }
  }
}