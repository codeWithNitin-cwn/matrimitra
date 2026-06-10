import { Request, Response } from "express";
import { ReportingService } from "./reporting.service";

const reportingService = new ReportingService();

export class ReportingController {
  async getDashboardSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await reportingService.getDashboardSummary();
      res.status(200).json({ success: true, data: summary });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch dashboard summary";
      res.status(500).json({ success: false, error: { code: "SYSTEM_ERROR", message } });
    }
  }

  async getProposalStatusReport(req: Request, res: Response): Promise<void> {
    try {
      const report = await reportingService.getProposalStatusReport();
      res.status(200).json({ success: true, data: report });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch proposal status report";
      res.status(500).json({ success: false, error: { code: "SYSTEM_ERROR", message } });
    }
  }

  async getPipelineStageReport(req: Request, res: Response): Promise<void> {
    try {
      const report = await reportingService.getPipelineStageReport();
      res.status(200).json({ success: true, data: report });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch pipeline stage report";
      res.status(500).json({ success: false, error: { code: "SYSTEM_ERROR", message } });
    }
  }
}