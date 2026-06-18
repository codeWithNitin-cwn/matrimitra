import { Request, Response } from "express";
import { AgencyUserService } from "./agency-user.service";
import { createAgencyUserSchema, updateAgencyUserSchema } from "./agency-user.validator";

const agencyUserService = new AgencyUserService();

export class AgencyUserController {
  async getAgencyUsers(req: Request, res: Response): Promise<void> {
    try {
      const agencyId = req.user!.agencyId;
      const users = await agencyUserService.getAgencyUsers(agencyId);

      const safeUsers = users.map(user => {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
      });

      res.status(200).json({ success: true, data: safeUsers });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch agency users";
      res.status(500).json({
        success: false,
        error: {
          code: "SYSTEM_ERROR",
          message
        }
      });
    }
  }

  async createAgencyUser(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = createAgencyUserSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const user = await agencyUserService.createAgencyUser(validationResult.data);

      // Omit the password hash from the response payload for security
      const { passwordHash, ...safeUser } = user;

      res.status(201).json({ success: true, data: safeUser });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create agency user";
      res.status(409).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }

  async updateAgencyUser(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = updateAgencyUserSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const agencyId = req.user!.agencyId;
      const currentUserId = req.user!.id;
      const targetUserId = req.params.id as string;

      const user = await agencyUserService.updateAgencyUser(targetUserId, agencyId, currentUserId, validationResult.data);

      const { passwordHash, ...safeUser } = user;

      res.status(200).json({ success: true, data: safeUser });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update agency user";
      res.status(400).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }
}
