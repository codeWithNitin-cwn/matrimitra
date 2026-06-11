import { Router } from "express";
import { ProfileController } from "./profile.controller";

const router = Router();
const profileController = new ProfileController();

router.get("/", (req, res) => profileController.getProfiles(req, res));
router.post("/", (req, res) => profileController.createProfile(req, res));
router.post("/draft", (req, res) => profileController.createDraft(req, res));
router.get("/:profileId", (req, res) => profileController.getProfileById(req, res));
router.post("/:profileId/personal", (req, res) => profileController.createProfilePersonal(req, res));
router.post("/:profileId/education", (req, res) => profileController.createProfileEducation(req, res));
router.post("/:profileId/career", (req, res) => profileController.createProfileCareer(req, res));
router.post("/:profileId/family", (req, res) => profileController.createProfileFamily(req, res));
router.post("/:profileId/lifestyle", (req, res) => profileController.createProfileLifestyle(req, res));
router.post("/:profileId/preference", (req, res) => profileController.createProfilePreference(req, res));
router.post("/:profileId/answers", (req, res) => profileController.createProfileAnswer(req, res));
router.get("/:profileId/answers", (req, res) => profileController.getProfileAnswers(req, res));

export { router as profileRoutes };