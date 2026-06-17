import { Request, Response } from "express";
import { ReportingService } from "./reporting.service";

const reportingService = new ReportingService();

export class ReportingController {
  async getDashboardSummary(req: Request, res: Response): Promise<void> {
    try {
      const agencyId = req.user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User context not available" } });
        return;
      }
      const summary = await reportingService.getDashboardSummary(agencyId);
      res.status(200).json({ success: true, data: summary });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch dashboard summary";
      res.status(500).json({ success: false, error: { code: "SYSTEM_ERROR", message } });
    }
  }

  async getProposalStatusReport(req: Request, res: Response): Promise<void> {
    try {
      const agencyId = req.user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User context not available" } });
        return;
      }
      const report = await reportingService.getProposalStatusReport(agencyId);
      res.status(200).json({ success: true, data: report });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch proposal status report";
      res.status(500).json({ success: false, error: { code: "SYSTEM_ERROR", message } });
    }
  }

  async getPipelineStageReport(req: Request, res: Response): Promise<void> {
    try {
      const agencyId = req.user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User context not available" } });
        return;
      }
      const report = await reportingService.getPipelineStageReport(agencyId);
      res.status(200).json({ success: true, data: report });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch pipeline stage report";
      res.status(500).json({ success: false, error: { code: "SYSTEM_ERROR", message } });
    }
  }

  async getDetailedProfiles(req: Request, res: Response): Promise<void> {
    try {
      const agencyId = req.user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User context not available" } });
        return;
      }
      const report = await reportingService.getDetailedProfiles(agencyId);
      res.status(200).json({ success: true, data: report });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch detailed profiles";
      res.status(500).json({ success: false, error: { code: "SYSTEM_ERROR", message } });
    }
  }

  async getDetailedProposals(req: Request, res: Response): Promise<void> {
    try {
      const agencyId = req.user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User context not available" } });
        return;
      }
      const report = await reportingService.getDetailedProposals(agencyId);
      res.status(200).json({ success: true, data: report });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch detailed proposals";
      res.status(500).json({ success: false, error: { code: "SYSTEM_ERROR", message } });
    }
  }

  async getDetailedPipelines(req: Request, res: Response): Promise<void> {
    try {
      const agencyId = req.user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User context not available" } });
        return;
      }
      const report = await reportingService.getDetailedPipelines(agencyId);
      res.status(200).json({ success: true, data: report });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch detailed pipelines";
      res.status(500).json({ success: false, error: { code: "SYSTEM_ERROR", message } });
    }
  }
}