import { Router } from "express";
import { ProfileController } from "./profile.controller";
import { requireRole } from "../auth/role.middleware";

const router = Router();
const profileController = new ProfileController();

// Read operations — all roles
router.get("/", (req, res) => profileController.getProfiles(req, res));
router.get("/:profileId", (req, res) => profileController.getProfileById(req, res));
router.get("/:profileId/answers", (req, res) => profileController.getProfileAnswers(req, res));

// Write operations — EXECUTIVE and above
router.post("/", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => profileController.createProfile(req, res));
router.post("/draft", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => profileController.createDraft(req, res));
router.put("/:profileId", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => profileController.updateDraft(req, res));
router.post("/:profileId/personal", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => profileController.createProfilePersonal(req, res));
router.post("/:profileId/education", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => profileController.createProfileEducation(req, res));
router.post("/:profileId/career", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => profileController.createProfileCareer(req, res));
router.post("/:profileId/family", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => profileController.createProfileFamily(req, res));
router.post("/:profileId/lifestyle", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => profileController.createProfileLifestyle(req, res));
router.post("/:profileId/preference", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => profileController.createProfilePreference(req, res));
router.post("/:profileId/answers", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => profileController.createProfileAnswer(req, res));

// Status changes (approve/reject) — MANAGER and above
router.patch("/:profileId/status", requireRole(["OWNER", "MANAGER"]), (req, res) => profileController.updateStatus(req, res));
router.post("/:profileId/onboarding-link", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => profileController.generateOnboardingLink(req, res));

// Profile access logs — all logged-in users
router.post("/:profileId/access-log", (req, res) => profileController.logAccess(req, res));

export { router as profileRoutes };