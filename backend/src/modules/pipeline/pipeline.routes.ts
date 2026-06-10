import { Router } from "express";
import { PipelineController } from "./pipeline.controller";

const router = Router();
const pipelineController = new PipelineController();

router.post("/", (req, res) => pipelineController.createPipeline(req, res));
router.get("/:proposalId", (req, res) => pipelineController.getPipelineByProposalId(req, res));
router.patch("/:proposalId", (req, res) => pipelineController.updatePipelineStage(req, res));

export { router as pipelineRoutes };