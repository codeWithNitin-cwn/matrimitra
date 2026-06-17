import { prisma } from "../../config/prisma";

export class MatchRepository {
  async getProfileWithPreferencesAndAnswers(profileId: string) {
    return prisma.agencyProfile.findUnique({
      where: { id: profileId },
      include: {
        person: true,
        preferences: true,
        answers: {
          include: {
            question: true,
            selectedOption: true
          }
        },
        personal: true,
        educations: true,
        careers: true,
        lifestyles: true,
        families: true,
        traits: true
      }
    });
  }

  async getOccupiedProfileIds(): Promise<string[]> {
    const activeProposals = await prisma.proposal.findMany({
      where: {
        proposalStatus: "ACCEPTED",
        OR: [
          { pipeline: { is: null } },
          {
            pipeline: {
              currentStage: {
                notIn: ["MARRIED", "CLOSED"]
              }
            }
          }
        ]
      },
      select: {
        brideProfileId: true,
        groomProfileId: true
      }
    });

    const ids = new Set<string>();
    for (const p of activeProposals) {
      ids.add(p.brideProfileId);
      ids.add(p.groomProfileId);
    }
    return Array.from(ids);
  }

  async getCandidateProfiles(excludeProfileId: string, targetGender: string, occupiedProfileIds: string[]) {
    return prisma.agencyProfile.findMany({
      where: {
        id: {
          notIn: [excludeProfileId, ...occupiedProfileIds]
        },
        status: "ACTIVE",
        person: {
          gender: {
            equals: targetGender,
            mode: "insensitive"
          }
        }
      },
      include: { 
        person: true, 
        personal: true, 
        educations: true, 
        careers: true, 
        answers: {
          include: {
            question: true,
            selectedOption: true
          }
        }, 
        preferences: true,
        lifestyles: true,
        families: true,
        traits: true
      }
    });
  }
}