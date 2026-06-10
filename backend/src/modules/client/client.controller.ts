import { Request, Response } from "express";
import { ClientService } from "./client.service";
import { createClientSchema } from "./client.validator";

const clientService = new ClientService();

export class ClientController {
  async createClient(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = createClientSchema.safeParse(req.body);

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

      const client = await clientService.createClient(validationResult.data);

      res.status(201).json({ success: true, data: client });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create client";
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