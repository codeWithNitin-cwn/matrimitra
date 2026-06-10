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
    return this.repository.findAll();
  }
}