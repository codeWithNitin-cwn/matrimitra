import { Router } from "express";
import { ReportingController } from "./reporting.controller";

const router = Router();
const reportingController = new ReportingController();

router.get("/dashboard", (req, res) => reportingController.getDashboardSummary(req, res));
router.get("/proposals", (req, res) => reportingController.getProposalStatusReport(req, res));
router.get("/pipeline", (req, res) => reportingController.getPipelineStageReport(req, res));

export { router as reportingRoutes };