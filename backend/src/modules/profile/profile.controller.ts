import { Request, Response } from "express";
import { ProfileService } from "./profile.service";
import { createProfileSchema, createProfilePersonalSchema, createProfileEducationSchema, createProfileCareerSchema, createProfileFamilySchema, createProfileLifestyleSchema, createProfilePreferenceSchema, createProfileAnswerSchema } from "./profile.validator";

const profileService = new ProfileService();

export class ProfileController {
  async createProfile(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = createProfileSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const profile = await profileService.createProfile(validationResult.data);

      res.status(201).json({ success: true, data: profile });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create profile";
      res.status(409).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }

  async createProfilePersonal(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      
      const validationResult = createProfilePersonalSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const profilePersonal = await profileService.createProfilePersonal(profileId, validationResult.data);

      res.status(201).json({ success: true, data: profilePersonal });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add personal details";
      res.status(409).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }

  async createProfileEducation(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      
      const validationResult = createProfileEducationSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const profileEducation = await profileService.createProfileEducation(profileId, validationResult.data);

      res.status(201).json({ success: true, data: profileEducation });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add education details";
      res.status(409).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }

  async createProfileCareer(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      
      const validationResult = createProfileCareerSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const profileCareer = await profileService.createProfileCareer(profileId, validationResult.data);

      res.status(201).json({ success: true, data: profileCareer });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add career details";
      res.status(409).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }

  async createProfileFamily(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      
      const validationResult = createProfileFamilySchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const profileFamily = await profileService.createProfileFamily(profileId, validationResult.data);

      res.status(201).json({ success: true, data: profileFamily });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add family details";
      res.status(409).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }

  async createProfileLifestyle(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      
      const validationResult = createProfileLifestyleSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const profileLifestyle = await profileService.createProfileLifestyle(profileId, validationResult.data);

      res.status(201).json({ success: true, data: profileLifestyle });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add lifestyle details";
      res.status(409).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }

  async createProfilePreference(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      
      const validationResult = createProfilePreferenceSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const profilePreference = await profileService.createProfilePreference(profileId, validationResult.data);

      res.status(201).json({ success: true, data: profilePreference });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add preference details";
      res.status(409).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }

  async createProfileAnswer(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      
      const validationResult = createProfileAnswerSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const profileAnswer = await profileService.createProfileAnswer(profileId, validationResult.data);

      res.status(201).json({ success: true, data: profileAnswer });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save profile answer";
      res.status(409).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }

  async getProfileAnswers(req: Request, res: Response): Promise<void> {
    try {
      const answers = await profileService.getProfileAnswers(req.params.profileId);
      res.status(200).json({ success: true, data: answers });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch answers";
      res.status(404).json({
        success: false,
        error: { code: "BUSINESS_RULE_ERROR", message }
      });
    }
  }
}