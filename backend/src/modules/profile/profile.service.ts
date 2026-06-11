import { ProfileRepository } from "./profile.repository";
import { CreateProfileDTO, CreateProfilePersonalDTO, CreateProfileEducationDTO, CreateProfileCareerDTO, CreateProfileFamilyDTO, CreateProfileLifestyleDTO, CreateProfilePreferenceDTO, CreateProfileAnswerDTO } from "./profile.validator";

export class ProfileService {
  private repository: ProfileRepository;

  constructor() {
    this.repository = new ProfileRepository();
  }

  async getProfiles() {
    return this.repository.findAllProfiles();
  }

  async createProfile(data: CreateProfileDTO) {
    const existingProfile = await this.repository.findByProfileNumber(data.profileNumber);
    if (existingProfile) {
      throw new Error("Profile number already exists");
    }

    const agency = await this.repository.findAgencyById(data.agencyId);
    if (!agency) {
      throw new Error("Agency does not exist");
    }

    const person = await this.repository.findPersonById(data.personId);
    if (!person) {
      throw new Error("Person does not exist");
    }

    if (data.assignedUserId) {
      const assignedUser = await this.repository.findAgencyUserById(data.assignedUserId);
      if (!assignedUser) {
        throw new Error("Assigned user does not exist");
      }
    }

    return this.repository.create({
      ...data,
    });
  }

  async createProfilePersonal(profileId: string, data: CreateProfilePersonalDTO) {
    const profile = await this.repository.findProfileById(profileId);
    if (!profile) {
      throw new Error("Agency profile does not exist");
    }

    const existingPersonal = await this.repository.findProfilePersonalByProfileId(profileId);
    if (existingPersonal) {
      throw new Error("Personal details already exist for this profile");
    }

    return this.repository.createProfilePersonal({
      profileId,
      ...data
    });
  }

  async createProfileEducation(profileId: string, data: CreateProfileEducationDTO) {
    const profile = await this.repository.findProfileById(profileId);
    if (!profile) {
      throw new Error("Agency profile does not exist");
    }

    return this.repository.createProfileEducation({
      profileId,
      ...data
    });
  }

  async createProfileCareer(profileId: string, data: CreateProfileCareerDTO) {
    const profile = await this.repository.findProfileById(profileId);
    if (!profile) {
      throw new Error("Agency profile does not exist");
    }

    return this.repository.createProfileCareer({
      profileId,
      ...data
    });
  }

  async createProfileFamily(profileId: string, data: CreateProfileFamilyDTO) {
    const profile = await this.repository.findProfileById(profileId);
    if (!profile) {
      throw new Error("Agency profile does not exist");
    }

    return this.repository.createProfileFamily({
      profileId,
      ...data
    });
  }

  async createProfileLifestyle(profileId: string, data: CreateProfileLifestyleDTO) {
    const profile = await this.repository.findProfileById(profileId);
    if (!profile) {
      throw new Error("Agency profile does not exist");
    }

    return this.repository.createProfileLifestyle({
      profileId,
      ...data
    });
  }

  async createProfilePreference(profileId: string, data: CreateProfilePreferenceDTO) {
    const profile = await this.repository.findProfileById(profileId);
    if (!profile) {
      throw new Error("Agency profile does not exist");
    }

    return this.repository.createProfilePreference({
      profileId,
      minAge: data.minAge,
      maxAge: data.maxAge,
      agePriority: data.agePriority,
      minHeight: data.minHeight,
      maxHeight: data.maxHeight,
      heightPriority: data.heightPriority,
      religion: data.religion,
      religionPriority: data.religionPriority,
      caste: data.caste,
      castePriority: data.castePriority,
      city: data.city,
      cityPriority: data.cityPriority,
      education: data.education,
      educationPriority: data.educationPriority,
      profession: data.profession,
      professionPriority: data.professionPriority,
    });
  }

  async createProfileAnswer(profileId: string, data: CreateProfileAnswerDTO) {
    const profile = await this.repository.findProfileById(profileId);
    if (!profile) {
      throw new Error("Agency profile does not exist");
    }

    const option = await this.repository.findQuestionOptionById(data.selectedOptionId);
    if (!option) {
      throw new Error("Selected option does not exist");
    }
    if (option.questionId !== data.questionId) {
      throw new Error("Selected option does not belong to the specified question");
    }

    return this.repository.upsertProfileAnswer(profileId, {
      profileId,
      questionId: data.questionId,
      selectedOptionId: data.selectedOptionId,
      importance: data.importance as any, // Cast enum to align Zod with Prisma types
    });
  }

  async getProfileAnswers(profileId: string) {
    const profile = await this.repository.findProfileById(profileId);
    if (!profile) {
      throw new Error("Agency profile does not exist");
    }
    return this.repository.findProfileAnswers(profileId);
  }
}