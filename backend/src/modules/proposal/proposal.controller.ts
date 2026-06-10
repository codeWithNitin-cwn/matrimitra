import { Request, Response } from "express";
import { ProposalService } from "./proposal.service";
import { createProposalSchema, addActivitySchema } from "./proposal.validator";

const proposalService = new ProposalService();

export class ProposalController {
  async createProposal(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = createProposalSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ") } });
        return;
      }
      const proposal = await proposalService.createProposal(validationResult.data);
      res.status(201).json({ success: true, data: proposal });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create proposal";
      res.status(409).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async getProposals(req: Request, res: Response): Promise<void> {
    try {
      const proposals = await proposalService.getProposals();
      res.status(200).json({ success: true, data: proposals });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch proposals";
      res.status(500).json({ success: false, error: { code: "SYSTEM_ERROR", message } });
    }
  }

  async getProposalById(req: Request, res: Response): Promise<void> {
    try {
      const proposal = await proposalService.getProposalById(req.params.id);
      res.status(200).json({ success: true, data: proposal });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch proposal";
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message } });
    }
  }

  async acceptProposal(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = addActivitySchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ") } });
        return;
      }
      const activity = await proposalService.acceptProposal(req.params.id, validationResult.data);
      res.status(200).json({ success: true, data: activity });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to accept proposal";
      res.status(409).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async rejectProposal(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = addActivitySchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ") } });
        return;
      }
      const activity = await proposalService.rejectProposal(req.params.id, validationResult.data);
      res.status(200).json({ success: true, data: activity });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to reject proposal";
      res.status(409).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }
}