import { Router } from "express";
import { ProfileController } from "./profile.controller";
import { requireRole } from "../auth/role.middleware";
import { upload } from "../../config/multer";

const router = Router();
const profileController = new ProfileController();

// Read operations — OWNER, PROFILE_MANAGER, MATCHING_MANAGER, RELATIONSHIP_MANAGER
router.get("/", requireRole(["OWNER", "PROFILE_MANAGER", "MATCHING_MANAGER", "RELATIONSHIP_MANAGER"]), (req, res) => profileController.getProfiles(req, res));
router.get("/:profileId", requireRole(["OWNER", "PROFILE_MANAGER", "MATCHING_MANAGER", "RELATIONSHIP_MANAGER"]), (req, res) => profileController.getProfileById(req, res));
router.get("/:profileId/answers", requireRole(["OWNER", "PROFILE_MANAGER", "MATCHING_MANAGER", "RELATIONSHIP_MANAGER"]), (req, res) => profileController.getProfileAnswers(req, res));

// Write operations — OWNER and PROFILE_MANAGER
router.post("/", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => profileController.createProfile(req, res));
router.post("/draft", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => profileController.createDraft(req, res));
router.put("/:profileId", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => profileController.updateDraft(req, res));
router.post("/:profileId/personal", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => profileController.createProfilePersonal(req, res));
router.post("/:profileId/education", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => profileController.createProfileEducation(req, res));
router.post("/:profileId/career", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => profileController.createProfileCareer(req, res));
router.post("/:profileId/family", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => profileController.createProfileFamily(req, res));
router.post("/:profileId/lifestyle", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => profileController.createProfileLifestyle(req, res));
router.post("/:profileId/preference", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => profileController.createProfilePreference(req, res));
router.post("/:profileId/answers", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => profileController.createProfileAnswer(req, res));
router.post("/:profileId/upload-photo", requireRole(["OWNER", "PROFILE_MANAGER"]), upload.single("photo"), (req, res) => profileController.uploadPhoto(req, res));

// Status changes — OWNER and PROFILE_MANAGER
router.patch("/:profileId/status", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => profileController.updateStatus(req, res));
router.post("/:profileId/onboarding-link", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => profileController.generateOnboardingLink(req, res));

// Profile access logs — OWNER, PROFILE_MANAGER, MATCHING_MANAGER, RELATIONSHIP_MANAGER
router.post("/:profileId/access-log", requireRole(["OWNER", "PROFILE_MANAGER", "MATCHING_MANAGER", "RELATIONSHIP_MANAGER"]), (req, res) => profileController.logAccess(req, res));

// Profile deletion — OWNER only
router.delete("/:profileId", requireRole(["OWNER"]), (req, res) => profileController.deleteProfile(req, res));

export { router as profileRoutes };