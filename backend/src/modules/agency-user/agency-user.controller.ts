import { Request, Response } from "express";
import { AgencyUserService } from "./agency-user.service";
import { createAgencyUserSchema } from "./agency-user.validator";

const agencyUserService = new AgencyUserService();

export class AgencyUserController {
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
}
