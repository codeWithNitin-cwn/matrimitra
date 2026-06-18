import { Router } from "express";
import { FollowUpController } from "./followup.controller.js";
import { requireRole } from "../auth/role.middleware.js";

const router = Router();
const controller = new FollowUpController();

router.get("/", requireRole(["OWNER", "RELATIONSHIP_MANAGER"]), (req, res) => controller.getFollowUps(req, res));
router.get("/:id", requireRole(["OWNER", "RELATIONSHIP_MANAGER"]), (req, res) => controller.getFollowUpById(req, res));
router.post("/", requireRole(["OWNER", "RELATIONSHIP_MANAGER"]), (req, res) => controller.createFollowUp(req, res));
router.put("/:id", requireRole(["OWNER", "RELATIONSHIP_MANAGER"]), (req, res) => controller.updateFollowUp(req, res));
router.delete("/:id", requireRole(["OWNER", "RELATIONSHIP_MANAGER"]), (req, res) => controller.deleteFollowUp(req, res));
router.patch("/:id/complete", requireRole(["OWNER", "RELATIONSHIP_MANAGER"]), (req, res) => controller.markComplete(req, res));

export { router as followUpRoutes };
