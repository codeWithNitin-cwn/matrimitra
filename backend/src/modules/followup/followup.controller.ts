import { Request, Response } from "express";
import { FollowUpService } from "./followup.service.js";
import { createFollowUpSchema, updateFollowUpSchema } from "./followup.validator.js";

export class FollowUpController {
  private service: FollowUpService;

  constructor() {
    this.service = new FollowUpService();
  }

  async getFollowUps(req: Request, res: Response): Promise<void> {
    try {
      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }
      const logs = await this.service.getFollowUps(agencyId);
      res.status(200).json({ success: true, data: logs });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch follow-ups";
      res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message } });
    }
  }

  async getFollowUpById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (typeof id !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid ID format" } });
        return;
      }
      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }
      const log = await this.service.getFollowUpById(id, agencyId);
      res.status(200).json({ success: true, data: log });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch follow-up";
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message } });
    }
  }

  async createFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = createFollowUpSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }

      const log = await this.service.createFollowUp(validationResult.data, agencyId);
      res.status(201).json({ success: true, data: log });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create follow-up";
      if (message.includes("Unauthorized")) {
        res.status(403).json({ success: false, error: { code: "FORBIDDEN", message } });
        return;
      }
      res.status(400).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async updateFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (typeof id !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid ID format" } });
        return;
      }
      const validationResult = updateFollowUpSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }

      const log = await this.service.updateFollowUp(id, validationResult.data, agencyId);
      res.status(200).json({ success: true, data: log });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update follow-up";
      res.status(400).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async deleteFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (typeof id !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid ID format" } });
        return;
      }
      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }

      await this.service.deleteFollowUp(id, agencyId);
      res.status(200).json({ success: true, data: { id } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete follow-up";
      res.status(400).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async markComplete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (typeof id !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid ID format" } });
        return;
      }
      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }

      const log = await this.service.markComplete(id, agencyId);
      res.status(200).json({ success: true, data: log });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to mark follow-up complete";
      res.status(400).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }
}
