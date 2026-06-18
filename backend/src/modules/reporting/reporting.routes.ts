import { Router } from "express";
import { ReportingController } from "./reporting.controller";
import { requireRole } from "../auth/role.middleware";

const router = Router();
const reportingController = new ReportingController();

router.get("/dashboard", requireRole(["OWNER"]), (req, res) => reportingController.getDashboardSummary(req, res));
router.get("/proposals", requireRole(["OWNER"]), (req, res) => reportingController.getProposalStatusReport(req, res));
router.get("/pipeline", requireRole(["OWNER"]), (req, res) => reportingController.getPipelineStageReport(req, res));
router.get("/export/profiles", requireRole(["OWNER"]), (req, res) => reportingController.getDetailedProfiles(req, res));
router.get("/export/proposals", requireRole(["OWNER"]), (req, res) => reportingController.getDetailedProposals(req, res));
router.get("/export/pipelines", requireRole(["OWNER"]), (req, res) => reportingController.getDetailedPipelines(req, res));

export { router as reportingRoutes };