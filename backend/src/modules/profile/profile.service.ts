import { ProfileRepository } from "./profile.repository";
import { CreateProfileDTO, CreateProfilePersonalDTO, CreateProfileEducationDTO, CreateProfileCareerDTO, CreateProfileFamilyDTO, CreateProfileLifestyleDTO, CreateProfilePreferenceDTO, CreateProfileAnswerDTO } from "./profile.validator";
import { prisma } from "../../config/prisma";
import { generateProfileSummary } from "../../integrations/gemini.js";
import { TraitService } from "../match/trait.service.js";
import crypto from "crypto";

export class ProfileService {
  private repository: ProfileRepository;
  private traitService: TraitService;

  constructor() {
    this.repository = new ProfileRepository();
    this.traitService = new TraitService();
  }

  async createDraft(agencyId: string, assignedUserId: string | undefined, data: any) {
    const profileNumber = `PR-${Date.now()}`;
    
    let profileType = 'OTHER';
    if (data.gender) {
      profileType = data.gender.toUpperCase() === 'FEMALE' ? 'BRIDE' : 'GROOM';
    }

    return this.repository.createDraftTransaction(
      agencyId,
      assignedUserId,
      profileNumber,
      profileType,
      data
    );
  }

  async getProfileById(id: string, queryingAgencyId: string, queryingUserId: string) {
    const profile = await this.repository.findFullProfileById(id);
    if (!profile) {
      throw new Error("Profile not found");
    }
    if (profile.agencyId !== queryingAgencyId) {
      const isAccepted = await this.repository.hasAcceptedProposal(id, queryingAgencyId);
      if (!isAccepted) {
        if (profile.person) {
          profile.person.firstName = "Partner";
          profile.person.lastName = "Client";
          profile.person.email = "Hidden until proposal acceptance";
          profile.person.mobile = "Hidden until proposal acceptance";
        }
        profile.photos = [];
        profile.documents = [];
        profile.aiSummary = "Hidden until proposal acceptance";
        profile.answers = [];
        profile.families = [];
        profile.lifestyles = [];
      }
    }

    // Generate AI Profile Summary on the fly if profile is ACTIVE or APPROVED
    if (profile.status === "ACTIVE" || profile.status === "APPROVED") {
      try {
        const summary = await generateProfileSummary(profile);
        (profile as any).aiSummary = summary;
      } catch (err) {
        console.error("Failed to generate AI profile summary on demand:", err);
        (profile as any).aiSummary = "";
      }
    }

    await prisma.auditLog.create({
      data: {
        agencyId: queryingAgencyId,
        userId: queryingUserId,
        entityType: "PROFILE",
        entityId: id,
        action: "VIEW"
      }
    });

    this.logAccess(id, queryingAgencyId, queryingUserId, "VIEW_PROFILE")
      .catch(err => console.error("Failed to create profile access log:", err));

    // Parse question texts in answers
    if (profile.answers && Array.isArray(profile.answers)) {
      profile.answers = profile.answers.map((ans: any) => {
        if (ans.question) {
          try {
            const parsed = JSON.parse(ans.question.questionText);
            ans.question = {
              ...ans.question,
              questionText: parsed.text || ans.question.questionText,
              customCategory: parsed.category || ans.question.category,
              type: parsed.type || "SINGLE_CHOICE"
            };
          } catch (e) {
            ans.question.customCategory = ans.question.category;
            ans.question.type = "SINGLE_CHOICE";
          }
        }
        return ans;
      }) as any;
    }

    return profile;
  }

  async getProfiles(queryingAgencyId: string) {
    const profiles = await this.repository.findAllProfiles(queryingAgencyId);
    return profiles;
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

  async createProfilePersonal(profileId: string, queryingAgencyId: string, data: CreateProfilePersonalDTO) {
    const profile = await this.repository.findProfileById(profileId);
    if (!profile) {
      throw new Error("Agency profile does not exist");
    }
    if (profile.agencyId !== queryingAgencyId) {
      throw new Error("Unauthorized: Profile belongs to another agency");
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

  async createProfileEducation(profileId: string, queryingAgencyId: string, data: CreateProfileEducationDTO) {
    const profile = await this.repository.findProfileById(profileId);
    if (!profile) {
      throw new Error("Agency profile does not exist");
    }
    if (profile.agencyId !== queryingAgencyId) {
      throw new Error("Unauthorized: Profile belongs to another agency");
    }

    return this.repository.createProfileEducation({
      profileId,
      ...data
    });
  }

  async createProfileCareer(profileId: string, queryingAgencyId: string, data: CreateProfileCareerDTO) {
    const profile = await this.repository.findProfileById(profileId);
    if (!profile) {
      throw new Error("Agency profile does not exist");
    }
    if (profile.agencyId !== queryingAgencyId) {
      throw new Error("Unauthorized: Profile belongs to another agency");
    }

    return this.repository.createProfileCareer({
      profileId,
      ...data
    });
  }

  async createProfileFamily(profileId: string, queryingAgencyId: string, data: CreateProfileFamilyDTO) {
    const profile = await this.repository.findProfileById(profileId);
    if (!profile) {
      throw new Error("Agency profile does not exist");
    }
    if (profile.agencyId !== queryingAgencyId) {
      throw new Error("Unauthorized: Profile belongs to another agency");
    }

    return this.repository.createProfileFamily({
      profileId,
      ...data
    });
  }

  async createProfileLifestyle(profileId: string, queryingAgencyId: string, data: CreateProfileLifestyleDTO) {
    const profile = await this.repository.findProfileById(profileId);
    if (!profile) {
      throw new Error("Agency profile does not exist");
    }
    if (profile.agencyId !== queryingAgencyId) {
      throw new Error("Unauthorized: Profile belongs to another agency");
    }

    return this.repository.createProfileLifestyle({
      profileId,
      ...data
    });
  }

  async createProfilePreference(profileId: string, queryingAgencyId: string, data: CreateProfilePreferenceDTO) {
    const profile = await this.repository.findProfileById(profileId);
    if (!profile) {
      throw new Error("Agency profile does not exist");
    }
    if (profile.agencyId !== queryingAgencyId) {
      throw new Error("Unauthorized: Profile belongs to another agency");
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
  async updateDraft(profileId: string, queryingAgencyId: string, queryingUserId: string, data: any) {
    const profile = await this.repository.findProfileById(profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }
    if (profile.agencyId !== queryingAgencyId) {
      throw new Error("Unauthorized: Profile belongs to another agency");
    }
    const result = await this.repository.updateDraftTransaction(profileId, data);

    await prisma.auditLog.create({
      data: {
        agencyId: queryingAgencyId,
        userId: queryingUserId,
        entityType: "PROFILE",
        entityId: profileId,
        action: "UPDATE"
      }
    });

    return result;
  }
  async getProfileAnswers(profileId: string) {
    const profile = await this.repository.findProfileById(profileId);
    if (!profile) {
      throw new Error("Agency profile does not exist");
    }
    return this.repository.findProfileAnswers(profileId);
  }

  async updateStatus(profileId: string, queryingAgencyId: string, queryingUserId: string, status: any) {
    const profile = await this.repository.findProfileById(profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }
    if (profile.agencyId !== queryingAgencyId) {
      throw new Error("Unauthorized: Profile belongs to another agency");
    }

    let result;
    if (status === "ACTIVE") {
      const isClientApproved = profile.clientApproved;
      const newStatus = isClientApproved ? "ACTIVE" : "UNDER_REVIEW";

      result = await prisma.agencyProfile.update({
        where: { id: profileId },
        data: {
          agencyApproved: true,
          agencyApprovedAt: new Date(),
          status: newStatus
        }
      });

      if (!isClientApproved) {
        throw new Error("Cannot activate profile. Client must approve first");
      }
    } else {
      // If setting to another status (like DRAFT or UNDER_REVIEW), also update flags if needed
      const dataUpdate: any = { status };
      if (status === "DRAFT") {
        dataUpdate.agencyApproved = false;
        dataUpdate.clientApproved = false;
      }
      result = await prisma.agencyProfile.update({
        where: { id: profileId },
        data: dataUpdate
      });
    }

    await prisma.auditLog.create({
      data: {
        agencyId: queryingAgencyId,
        userId: queryingUserId,
        entityType: "PROFILE",
        entityId: profileId,
        action: status === "ACTIVE" ? "ACTIVATE" : status
      }
    });

    if (status === "ACTIVE") {
      // Asynchronously trigger traits generation (fire-and-forget) to keep profile approval instant
      this.repository.findFullProfileById(profileId).then(fullProfile => {
        if (fullProfile) {
          this.traitService.generateAndStoreTraits(profileId, fullProfile, false)
            .catch(err => console.error(`Failed to generate AI traits asynchronously for ${profileId}:`, err));
        }
      }).catch(err => console.error(`Failed to load full profile asynchronously for trait generation:`, err));
    }

    return result;
  }

  async generateOnboardingLink(profileId: string, queryingAgencyId: string) {
    const profile = await this.repository.findProfileById(profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }
    if (profile.agencyId !== queryingAgencyId) {
      throw new Error("Unauthorized: Profile belongs to another agency");
    }

    const token = crypto.randomUUID();
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const link = `http://localhost:3000/onboard/${token}`;

    const updated = await prisma.agencyProfile.update({
      where: { id: profileId },
      data: {
        onboardingToken: token,
        onboardingExpiry: expiry,
        onboardingLink: link,
        status: "UNDER_REVIEW",
        clientApproved: false,
        agencyApproved: false,
        clientRejectedReason: null
      }
    });

    return { onboardingLink: link, token, expiry, profile: updated };
  }

  async getClientProfileByToken(token: string) {
    const profile = await prisma.agencyProfile.findFirst({
      where: {
        onboardingToken: token,
        onboardingExpiry: { gte: new Date() }
      }
    });

    if (!profile) {
      throw new Error("Invalid or expired onboarding token");
    }

    return this.repository.findFullProfileById(profile.id);
  }

  async clientApproveProfile(token: string) {
    const profile = await prisma.agencyProfile.findFirst({
      where: {
        onboardingToken: token,
        onboardingExpiry: { gte: new Date() }
      }
    });

    if (!profile) {
      throw new Error("Invalid or expired onboarding token");
    }

    const isAgencyApproved = profile.agencyApproved;
    const newStatus = isAgencyApproved ? "ACTIVE" : "UNDER_REVIEW";

    return prisma.agencyProfile.update({
      where: { id: profile.id },
      data: {
        clientApproved: true,
        clientApprovedAt: new Date(),
        status: newStatus,
        clientRejectedReason: null
      }
    });
  }

  async clientRequestChanges(token: string, reason?: string) {
    const profile = await prisma.agencyProfile.findFirst({
      where: {
        onboardingToken: token,
        onboardingExpiry: { gte: new Date() }
      }
    });

    if (!profile) {
      throw new Error("Invalid or expired onboarding token");
    }

    return prisma.agencyProfile.update({
      where: { id: profile.id },
      data: {
        status: "UNDER_REVIEW",
        clientApproved: false,
        clientRejectedReason: reason || null
      }
    });
  }

  async logAccess(profileId: string, agencyId: string, userId: string, action: string) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingLog = await prisma.profileAccessLog.findFirst({
      where: {
        profileId,
        viewedByUserId: userId,
        action,
        viewedAt: { gte: fiveMinutesAgo }
      }
    });

    if (existingLog) {
      return prisma.profileAccessLog.update({
        where: { id: existingLog.id },
        data: { viewedAt: new Date() }
      });
    }

    return prisma.profileAccessLog.create({
      data: {
        profileId,
        agencyId,
        viewedByUserId: userId,
        action
      }
    });
  }
}