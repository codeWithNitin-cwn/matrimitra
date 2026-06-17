import { Router } from "express";
import { PipelineController } from "./pipeline.controller";
import { requireRole } from "../auth/role.middleware";

const router = Router();
const pipelineController = new PipelineController();

// Read operations — all roles
router.get("/:proposalId", (req, res) => pipelineController.getPipelineByProposalId(req, res));
router.get("/:proposalId/assistant", (req, res) => pipelineController.getPipelineAssistant(req, res));

// Create and update pipeline stages — MANAGER and above
router.post("/", requireRole(["OWNER", "MANAGER"]), (req, res) => pipelineController.createPipeline(req, res));
router.patch("/:proposalId", requireRole(["OWNER", "MANAGER"]), (req, res) => pipelineController.updatePipelineStage(req, res));

export { router as pipelineRoutes };