import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { loginSchema } from "./auth.validator";

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = loginSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
          },
        });
        return;
      }

      const result = await authService.login(validationResult.data);

      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message },
      });
    }
  }
}