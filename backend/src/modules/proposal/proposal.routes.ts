import { Router } from "express";
import { ProposalController } from "./proposal.controller";
import { requireRole } from "../auth/role.middleware";

const router = Router();
const proposalController = new ProposalController();

// Read operations — OWNER and RELATIONSHIP_MANAGER
router.get("/", requireRole(["OWNER", "RELATIONSHIP_MANAGER"]), (req, res) => proposalController.getProposals(req, res));
router.get("/:id", requireRole(["OWNER", "RELATIONSHIP_MANAGER"]), (req, res) => proposalController.getProposalById(req, res));

// Create proposal — OWNER, RELATIONSHIP_MANAGER, and MATCHING_MANAGER
router.post("/", requireRole(["OWNER", "RELATIONSHIP_MANAGER", "MATCHING_MANAGER"]), (req, res) => proposalController.createProposal(req, res));

// Accept/Reject proposals — OWNER and RELATIONSHIP_MANAGER
router.patch("/:id/accept", requireRole(["OWNER", "RELATIONSHIP_MANAGER"]), (req, res) => proposalController.acceptProposal(req, res));
router.patch("/:id/reject", requireRole(["OWNER", "RELATIONSHIP_MANAGER"]), (req, res) => proposalController.rejectProposal(req, res));

export { router as proposalRoutes };