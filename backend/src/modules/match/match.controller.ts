import { Request, Response } from "express";
import { MatchService } from "./match.service";
import { prisma } from "../../config/prisma";

const matchService = new MatchService();

export class MatchController {
  async searchMatches(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      if (typeof profileId !== "string") {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid profile ID format" }
        });
        return;
      }

      // Bug #4 fix: Verify the requested profile belongs to the calling user's agency
      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }
      const profile = await prisma.agencyProfile.findUnique({
        where: { id: profileId },
        select: { agencyId: true }
      });
      if (!profile) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Profile not found" } });
        return;
      }
      if (profile.agencyId !== agencyId) {
        res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "You do not have permission to run matches for this profile" } });
        return;
      }

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

  async getProposalRecommendation(req: Request, res: Response): Promise<void> {
    try {
      const { profileId, candidateId } = req.params;
      if (typeof profileId !== "string" || typeof candidateId !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid parameters format" } });
        return;
      }
      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }

      const profile = await prisma.agencyProfile.findUnique({
        where: { id: profileId },
        select: { agencyId: true }
      });
      if (!profile || profile.agencyId !== agencyId) {
        res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Unauthorized access to target profile" } });
        return;
      }

      const recommendation = await matchService.getProposalRecommendation(profileId, candidateId);
      res.status(200).json({ success: true, data: recommendation });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch recommendation";
      res.status(400).json({
        success: false,
        error: { code: "BUSINESS_RULE_ERROR", message }
      });
    }
  }
}