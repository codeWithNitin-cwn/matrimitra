import { Request, Response } from "express";
import { QuestionService } from "./question.service";
import { createQuestionSchema } from "./question.validator";

const questionService = new QuestionService();

export class QuestionController {
  async createQuestion(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = createQuestionSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const question = await questionService.createQuestion(validationResult.data);
      res.status(201).json({ success: true, data: question });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create question";
      res.status(409).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message }});
    }
  }

  async getQuestions(req: Request, res: Response): Promise<void> {
    try {
      const questions = await questionService.getQuestions();
      res.status(200).json({ success: true, data: questions });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: { code: "SYSTEM_ERROR", message: "Failed to fetch questions" }});
    }
  }
}