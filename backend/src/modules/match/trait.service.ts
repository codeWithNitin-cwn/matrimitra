import { prisma } from "../../config/prisma.js";
import { generateAITraits } from "../../integrations/gemini.js";

export class TraitService {
  calculateDeterministicTraits(answers: any[]) {
    const findAnswerText = (keyword: string): string => {
      const ans = answers.find(a => {
        const qText = a.question?.questionText || "";
        return qText.toLowerCase().includes(keyword.toLowerCase());
      });
      return ans?.selectedOption?.optionText || "";
    };

    // 1. Communication Score
    let commPoints = [];
    const handleDisagreements = findAnswerText("handle disagreements");
    if (handleDisagreements) {
      if (handleDisagreements.includes("Discuss immediately")) commPoints.push(10);
      else if (handleDisagreements.includes("discuss later")) commPoints.push(8);
      else if (handleDisagreements.includes("mediation")) commPoints.push(5);
      else if (handleDisagreements.includes("confrontation")) commPoints.push(2);
    }
    const dailyComm = findAnswerText("daily communication");
    if (dailyComm) {
      if (dailyComm.includes("Extremely important")) commPoints.push(10);
      else if (dailyComm.includes("Important")) commPoints.push(8);
      else if (dailyComm.includes("Moderate")) commPoints.push(6);
      else if (dailyComm.includes("Not important")) commPoints.push(2);
    }
    const communicationScore = commPoints.length > 0 ? Math.round(commPoints.reduce((a, b) => a + b, 0) / commPoints.length) : null;

    // 2. Family Score
    let famPoints = [];
    const famSetup = findAnswerText("family setup");
    if (famSetup) {
      if (famSetup.includes("Joint family")) famPoints.push(9);
      else if (famSetup.includes("Either")) famPoints.push(6);
      else if (famSetup.includes("Nuclear family")) famPoints.push(3);
    }
    const parentInvolved = findAnswerText("parents be involved");
    if (parentInvolved) {
      if (parentInvolved.includes("Highly involved")) famPoints.push(9);
      else if (parentInvolved.includes("Moderately involved")) famPoints.push(6);
      else if (parentInvolved.includes("Minimal involvement")) famPoints.push(3);
    }
    const familyScore = famPoints.length > 0 ? Math.round(famPoints.reduce((a, b) => a + b, 0) / famPoints.length) : null;

    // 3. Career Score
    let carPoints = [];
    const partnersWork = findAnswerText("partners work");
    if (partnersWork) {
      if (partnersWork.includes("Yes")) carPoints.push(9);
      else if (partnersWork.includes("Depends")) carPoints.push(6);
      else if (partnersWork.includes("No")) carPoints.push(2);
    }
    const careerGrowth = findAnswerText("career growth");
    if (careerGrowth) {
      if (careerGrowth.includes("Extremely important")) carPoints.push(10);
      else if (careerGrowth.includes("Important")) carPoints.push(8);
      else if (careerGrowth.includes("Moderate")) carPoints.push(6);
      else if (careerGrowth.includes("Not important")) carPoints.push(2);
    }
    const preferredLifestyle = findAnswerText("preferred lifestyle");
    if (preferredLifestyle) {
      if (preferredLifestyle.includes("Career focused")) carPoints.push(10);
      else if (preferredLifestyle.includes("Balanced")) carPoints.push(7);
      else if (preferredLifestyle.includes("Family focused")) carPoints.push(4);
    }
    const careerScore = carPoints.length > 0 ? Math.round(carPoints.reduce((a, b) => a + b, 0) / carPoints.length) : null;

    // 4. Financial Score
    let finPoints = [];
    const spendingStyle = findAnswerText("spending style");
    if (spendingStyle) {
      if (spendingStyle.includes("Saver")) finPoints.push(9);
      else if (spendingStyle.includes("Balanced")) finPoints.push(7);
      else if (spendingStyle.includes("Spender")) finPoints.push(3);
    }
    const finPlanning = findAnswerText("financial planning");
    if (finPlanning) {
      if (finPlanning.includes("Very important")) finPoints.push(10);
      else if (finPlanning.includes("Important")) finPoints.push(8);
      else if (finPlanning.includes("Moderate")) finPoints.push(6);
      else if (finPlanning.includes("Not important")) finPoints.push(2);
    }
    const financialScore = finPoints.length > 0 ? Math.round(finPoints.reduce((a, b) => a + b, 0) / finPoints.length) : null;

    // 5. Lifestyle Score
    let lifePoints = [];
    const fitnessImportance = findAnswerText("fitness importance");
    if (fitnessImportance) {
      if (fitnessImportance.includes("Very important")) lifePoints.push(10);
      else if (fitnessImportance.includes("Important")) lifePoints.push(8);
      else if (fitnessImportance.includes("Moderate")) lifePoints.push(6);
      else if (fitnessImportance.includes("Not important")) lifePoints.push(2);
    }
    const weekendPref = findAnswerText("weekend preference");
    if (weekendPref) {
      if (weekendPref.includes("Travel")) lifePoints.push(9);
      else if (weekendPref.includes("Social")) lifePoints.push(8);
      else if (weekendPref.includes("Family")) lifePoints.push(6);
      else if (weekendPref.includes("Home")) lifePoints.push(4);
    }
    const lifestyleScore = lifePoints.length > 0 ? Math.round(lifePoints.reduce((a, b) => a + b, 0) / lifePoints.length) : null;

    // 6. Emotional Score
    let emotPoints = [];
    const stressSupport = findAnswerText("stress");
    if (stressSupport) {
      if (stressSupport.includes("Emotional support")) emotPoints.push(9);
      else if (stressSupport.includes("situation")) emotPoints.push(7);
      else if (stressSupport.includes("Practical")) emotPoints.push(5);
      else if (stressSupport.includes("Space")) emotPoints.push(4);
    }
    const spouseQuality = findAnswerText("quality matters most");
    if (spouseQuality) {
      if (spouseQuality.includes("understanding")) emotPoints.push(10);
      else if (spouseQuality.includes("Respect")) emotPoints.push(9);
      else if (spouseQuality.includes("Trust")) emotPoints.push(8);
      else if (spouseQuality.includes("Loyalty")) emotPoints.push(8);
      else if (spouseQuality.includes("Communication")) emotPoints.push(8);
    }
    const emotionalScore = emotPoints.length > 0 ? Math.round(emotPoints.reduce((a, b) => a + b, 0) / emotPoints.length) : null;

    // 7. Traditional Score
    let tradPoints = [];
    const tradImportance = findAnswerText("traditions");
    if (tradImportance) {
      if (tradImportance.includes("Very important")) tradPoints.push(10);
      else if (tradImportance.includes("Important")) tradPoints.push(8);
      else if (tradImportance.includes("Neutral")) tradPoints.push(5);
      else if (tradImportance.includes("Not important")) tradPoints.push(2);
    }
    const familyCareerConflict = findAnswerText("conflicts?");
    if (familyCareerConflict) {
      if (familyCareerConflict.includes("Family first")) tradPoints.push(9);
      else if (familyCareerConflict.includes("Balance both")) tradPoints.push(6);
      else if (familyCareerConflict.includes("Career first")) tradPoints.push(3);
    }
    const traditionalScore = tradPoints.length > 0 ? Math.round(tradPoints.reduce((a, b) => a + b, 0) / tradPoints.length) : null;

    // 8. Parenting Score
    let parPoints = [];
    const wantChildren = findAnswerText("want children");
    if (wantChildren) {
      if (wantChildren.includes("Yes")) parPoints.push(9);
      else if (wantChildren.includes("Undecided")) parPoints.push(5);
      else if (wantChildren.includes("No")) parPoints.push(2);
    }
    const childrenTimeline = findAnswerText("timeline for children");
    if (childrenTimeline) {
      if (childrenTimeline.includes("Immediately")) parPoints.push(9);
      else if (childrenTimeline.includes("1-2 years")) parPoints.push(8);
      else if (childrenTimeline.includes("3-5 years")) parPoints.push(6);
      else if (childrenTimeline.includes("Later")) parPoints.push(3);
    }
    const parentingScore = parPoints.length > 0 ? Math.round(parPoints.reduce((a, b) => a + b, 0) / parPoints.length) : null;

    // 9. Independence Score
    let indPoints = [];
    const personalSpace = findAnswerText("personal space");
    if (personalSpace) {
      if (personalSpace.includes("Very important")) indPoints.push(10);
      else if (personalSpace.includes("Important")) indPoints.push(8);
      else if (personalSpace.includes("Moderate")) indPoints.push(6);
      else if (personalSpace.includes("Not important")) indPoints.push(2);
    }
    const settleLocation = findAnswerText("settle");
    if (settleLocation) {
      if (settleLocation.includes("Abroad")) indPoints.push(9);
      else if (settleLocation.includes("Flexible")) indPoints.push(7);
      else if (settleLocation.includes("Metro")) indPoints.push(6);
      else if (settleLocation.includes("Current")) indPoints.push(5);
    }
    const independenceScore = indPoints.length > 0 ? Math.round(indPoints.reduce((a, b) => a + b, 0) / indPoints.length) : null;

    return {
      communicationScore,
      familyScore,
      careerScore,
      financialScore,
      lifestyleScore,
      emotionalScore,
      traditionalScore,
      parentingScore,
      independenceScore
    };
  }

  async generateAndStoreTraits(profileId: string, profile: any, forceDeterministic = false): Promise<any> {
    let traits: any = null;

    if (!forceDeterministic && process.env.GEMINI_API_KEY) {
      try {
        traits = await generateAITraits(profile);
      } catch (error) {
        console.error("Error generating AI traits via Gemini, falling back:", error);
      }
    }

    if (!traits) {
      traits = this.calculateDeterministicTraits(profile.answers || []);
    }

    return prisma.userTrait.upsert({
      where: { profileId },
      update: { ...traits, generatedAt: new Date() },
      create: { profileId, ...traits }
    });
  }

  async getOrGenerateTraits(profileId: string, profile: any): Promise<any> {
    const existing = await prisma.userTrait.findUnique({
      where: { profileId }
    });
    if (existing) {
      return existing;
    }
    // Force deterministic in searchMatches!
    return this.generateAndStoreTraits(profileId, profile, true);
  }
}
