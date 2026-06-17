import { Request, Response } from "express";
import { ProposalService } from "./proposal.service";
import { createProposalSchema, addActivitySchema } from "./proposal.validator";

const proposalService = new ProposalService();

export class ProposalController {
  async createProposal(req: Request, res: Response): Promise<void> {
    try {
      const agencyId = (req as any).user?.agencyId;
      const userId = (req as any).user?.id;
      if (!agencyId || !userId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }
      const validationResult = createProposalSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ") } });
        return;
      }
      // agencyId and userId come from JWT — not from client body
      const proposal = await proposalService.createProposal(validationResult.data, agencyId, userId);
      res.status(201).json({ success: true, data: proposal });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create proposal";
      res.status(409).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async getProposals(req: Request, res: Response): Promise<void> {
    try {
      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }
      const proposals = await proposalService.getProposals(agencyId);
      res.status(200).json({ success: true, data: proposals });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch proposals";
      res.status(500).json({ success: false, error: { code: "SYSTEM_ERROR", message } });
    }
  }

  async getProposalById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (typeof id !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid proposal ID format" } });
        return;
      }
      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }
      const proposal = await proposalService.getProposalById(id, agencyId);
      res.status(200).json({ success: true, data: proposal });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch proposal";
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message } });
    }
  }

  async acceptProposal(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (typeof id !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid proposal ID format" } });
        return;
      }
      const validationResult = addActivitySchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ") } });
        return;
      }
      const agencyId = (req as any).user?.agencyId;
      const userId = (req as any).user?.id;
      if (!agencyId || !userId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }
      const activityData = { activityNotes: validationResult.data.activityNotes };
      const activity = await proposalService.acceptProposal(id, agencyId, userId, activityData);
      res.status(200).json({ success: true, data: activity });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to accept proposal";
      res.status(409).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }
 
  async rejectProposal(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (typeof id !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid proposal ID format" } });
        return;
      }
      const validationResult = addActivitySchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ") } });
        return;
      }
      const agencyId = (req as any).user?.agencyId;
      const userId = (req as any).user?.id;
      if (!agencyId || !userId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }
      const activityData = { activityNotes: validationResult.data.activityNotes };
      const activity = await proposalService.rejectProposal(id, agencyId, userId, activityData);
      res.status(200).json({ success: true, data: activity });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to reject proposal";
      res.status(409).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }
}