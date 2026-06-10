import { prisma } from "../../config/prisma";
import { Prisma } from "../../generated/prisma/client";

export class ProfileRepository {
  async findByProfileNumber(profileNumber: string) {
    return prisma.agencyProfile.findUnique({ where: { profileNumber } });
  }

  async findAgencyById(id: string) {
    return prisma.agency.findUnique({ where: { id } });
  }

  async findPersonById(id: string) {
    return prisma.person.findUnique({ where: { id } });
  }

  async findAgencyUserById(id: string) {
    return prisma.agencyUser.findUnique({ where: { id } });
  }

  async create(data: Prisma.AgencyProfileUncheckedCreateInput) {
    return prisma.agencyProfile.create({ data });
  }

  async findProfileById(id: string) {
    return prisma.agencyProfile.findUnique({ where: { id } });
  }

  async findProfilePersonalByProfileId(profileId: string) {
    return prisma.profilePersonal.findUnique({ where: { profileId } });
  }

  async createProfilePersonal(data: Prisma.ProfilePersonalUncheckedCreateInput) {
    return prisma.profilePersonal.create({ data });
  }

  async createProfileEducation(data: Prisma.ProfileEducationUncheckedCreateInput) {
    return prisma.profileEducation.create({ data });
  }

  async createProfileCareer(data: Prisma.ProfileCareerUncheckedCreateInput) {
    return prisma.profileCareer.create({ data });
  }

  async createProfileFamily(data: Prisma.ProfileFamilyUncheckedCreateInput) {
    return prisma.profileFamily.create({ data });
  }

  async createProfileLifestyle(data: Prisma.ProfileLifestyleUncheckedCreateInput) {
    return prisma.profileLifestyle.create({ data });
  }

  async createProfilePreference(data: Prisma.ProfilePreferenceUncheckedCreateInput) {
    return prisma.profilePreference.create({ data });
  }

  async findProfileAnswers(profileId: string) {
    return prisma.profileAnswer.findMany({
      where: { profileId },
      include: {
        question: true,
        selectedOption: true
      }
    });
  }

  async findQuestionOptionById(id: string) {
    return prisma.questionOption.findUnique({ where: { id } });
  }

  async upsertProfileAnswer(profileId: string, data: Prisma.ProfileAnswerUncheckedCreateInput) {
    return prisma.profileAnswer.upsert({
      where: {
        profileId_questionId: { profileId, questionId: data.questionId }
      },
      update: { selectedOptionId: data.selectedOptionId, importance: data.importance },
      create: data
    });
  }
}