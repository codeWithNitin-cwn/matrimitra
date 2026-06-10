import { Request, Response } from "express";
import { AgencyService } from "./agency.service";
import { createAgencySchema } from "./agency.validator";

const agencyService = new AgencyService();

export class AgencyController {
  async createAgency(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = createAgencySchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const agency = await agencyService.createAgency(validationResult.data);

      res.status(201).json({ success: true, data: agency });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create agency";
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