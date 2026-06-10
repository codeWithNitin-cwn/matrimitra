import { Request, Response } from "express";
import { MatchService } from "./match.service";

const matchService = new MatchService();

export class MatchController {
  async searchMatches(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      const matches = await matchService.searchMatches(profileId);
      res.status(200).json({ success: true, data: matches });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to search matches";
      res.status(400).json({
        success: false,
        error: { code: "BUSINESS_RULE_ERROR", message }
      });
    }
  }
}