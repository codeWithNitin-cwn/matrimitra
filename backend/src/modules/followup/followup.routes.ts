import { Router } from "express";
import { FollowUpController } from "./followup.controller.js";
import { requireRole } from "../auth/role.middleware.js";

const router = Router();
const controller = new FollowUpController();

router.get("/", (req, res) => controller.getFollowUps(req, res));
router.get("/:id", (req, res) => controller.getFollowUpById(req, res));
router.post("/", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => controller.createFollowUp(req, res));
router.put("/:id", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => controller.updateFollowUp(req, res));
router.delete("/:id", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => controller.deleteFollowUp(req, res));
router.patch("/:id/complete", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => controller.markComplete(req, res));

export { router as followUpRoutes };
