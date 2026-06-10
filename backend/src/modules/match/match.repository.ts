import { prisma } from "../../config/prisma";

export class MatchRepository {
  async getProfileWithPreferencesAndAnswers(profileId: string) {
    return prisma.agencyProfile.findUnique({
      where: { id: profileId },
      include: {
  person: true,
  preferences: true,
  answers: true,
  personal: true,
  educations: true,
  careers: true
}
    });
  }

  async getCandidateProfiles(excludeProfileId: string) {
    // For MVP: Fetching all other profiles. 
    // In production, this would be scoped to opposite gender, active status, and same agency/network.
    return prisma.agencyProfile.findMany({
      where: { id: { not: excludeProfileId } },
      include: { 
        person: true, 
        personal: true, 
        educations: true, 
        careers: true, 
        answers: true, 
        preferences: true 
      }
    });
  }
}