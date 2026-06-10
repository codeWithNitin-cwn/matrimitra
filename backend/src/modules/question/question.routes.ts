import { Router } from "express";
import { QuestionController } from "./question.controller";

const router = Router();
const questionController = new QuestionController();

router.post("/", (req, res) => questionController.createQuestion(req, res));
router.get("/", (req, res) => questionController.getQuestions(req, res));

export { router as questionRoutes };