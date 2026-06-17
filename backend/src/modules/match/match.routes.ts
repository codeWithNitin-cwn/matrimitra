import { Router } from "express";
import { MatchController } from "./match.controller";
import { requireRole } from "../auth/role.middleware";

const router = Router();
const matchController = new MatchController();

// Match search — EXECUTIVE and above (read-heavy but triggers AI/scoring pipeline)
router.get("/search/:profileId", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => matchController.searchMatches(req, res));
router.get("/recommendation/:profileId/:candidateId", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => matchController.getProposalRecommendation(req, res));

export { router as matchRoutes };