import { Router } from "express";
import { ProposalController } from "./proposal.controller";
import { requireRole } from "../auth/role.middleware";

const router = Router();
const proposalController = new ProposalController();

// Read operations — all roles
router.get("/", (req, res) => proposalController.getProposals(req, res));
router.get("/:id", (req, res) => proposalController.getProposalById(req, res));

// Create proposal — EXECUTIVE and above
router.post("/", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => proposalController.createProposal(req, res));

// Accept/Reject proposals — MANAGER and above
router.patch("/:id/accept", requireRole(["OWNER", "MANAGER"]), (req, res) => proposalController.acceptProposal(req, res));
router.patch("/:id/reject", requireRole(["OWNER", "MANAGER"]), (req, res) => proposalController.rejectProposal(req, res));

export { router as proposalRoutes };