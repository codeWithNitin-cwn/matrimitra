import { Router } from "express";
import { ProposalController } from "./proposal.controller";

const router = Router();
const proposalController = new ProposalController();

router.post("/", (req, res) => proposalController.createProposal(req, res));
router.get("/", (req, res) => proposalController.getProposals(req, res));
router.get("/:id", (req, res) => proposalController.getProposalById(req, res));
router.patch("/:id/accept", (req, res) => proposalController.acceptProposal(req, res));
router.patch("/:id/reject", (req, res) => proposalController.rejectProposal(req, res));

export { router as proposalRoutes };