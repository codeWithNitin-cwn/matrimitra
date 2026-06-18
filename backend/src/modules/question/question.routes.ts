import { Router } from "express";
import { QuestionController } from "./question.controller";
import { requireRole } from "../auth/role.middleware";

const router = Router();
const questionController = new QuestionController();

router.post("/", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => questionController.createQuestion(req, res));
router.get("/", requireRole(["OWNER", "PROFILE_MANAGER", "MATCHING_MANAGER", "RELATIONSHIP_MANAGER"]), (req, res) => questionController.getQuestions(req, res));

export { router as questionRoutes };