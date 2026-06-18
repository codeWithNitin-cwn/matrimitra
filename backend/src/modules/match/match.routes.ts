import { Router } from "express";
import { MatchController } from "./match.controller";
import { requireRole } from "../auth/role.middleware";

const router = Router();
const matchController = new MatchController();

// Match search — OWNER and MATCHING_MANAGER
router.get("/search/:profileId", requireRole(["OWNER", "MATCHING_MANAGER"]), (req, res) => matchController.searchMatches(req, res));
router.get("/recommendation/:profileId/:candidateId", requireRole(["OWNER", "MATCHING_MANAGER"]), (req, res) => matchController.getProposalRecommendation(req, res));

export { router as matchRoutes };