import { QuestionRepository } from "./question.repository";
import { CreateQuestionDTO } from "./question.validator";

export class QuestionService {
  private repository: QuestionRepository;

  constructor() {
    this.repository = new QuestionRepository();
  }

  async createQuestion(data: CreateQuestionDTO) {
    return this.repository.create({
      questionText: data.questionText,
      category: data.category,
      isActive: true,
      options: { create: data.options }
    });
  }

  async getQuestions() {
    const questions = await this.repository.findAll();
    return questions.map((q) => {
      try {
        const parsed = JSON.parse(q.questionText);
        return {
          ...q,
          questionText: parsed.text || q.questionText,
          customCategory: parsed.category || q.category,
          type: parsed.type || "SINGLE_CHOICE"
        };
      } catch (e) {
        return {
          ...q,
          customCategory: q.category,
          type: "SINGLE_CHOICE"
        };
      }
    });
  }
}