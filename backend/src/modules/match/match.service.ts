import { MatchRepository } from "./match.repository";

// Helper to calculate age from Date of Birth
function calculateAge(dob: Date | null): number | null {
  if (!dob) return null;
  const diff = Date.now() - dob.getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}

export class MatchService {
  private repository: MatchRepository;

  constructor() {
    this.repository = new MatchRepository();
  }

  async searchMatches(profileId: string) {
    const targetProfile = await this.repository.getProfileWithPreferencesAndAnswers(profileId);
    if (!targetProfile) {
      throw new Error("Target profile does not exist");
    }

    const targetPref = targetProfile.preferences[0]; // Active preference
    const targetAnswers = targetProfile.answers;

    const candidates = await this.repository.getCandidateProfiles(profileId);
    const rankedMatches = [];

    for (const candidate of candidates) {
      const candidatePref = candidate.preferences[0];
      const candidateAttributes = {
        age: calculateAge(candidate.person.dob),
        height: candidate.personal?.heightCm || null,
        religion: candidate.personal?.religion || null,
        caste: candidate.personal?.caste || null,
        city: candidate.personal?.city || null,
        education: candidate.educations[0]?.qualification || null,
        profession: candidate.careers[0]?.profession || null,
      };

      // ==========================================
      // 1. & 2. Mutual Preference Scoring & Hard Filters
      // ==========================================
      let disqualified = false;
      let prefScore = 0;
      let maxPrefScore = 0;
      const reasons: string[] = [];

      const evaluatePref = (priority: string, isMatch: boolean, hasPref: boolean, reasonText: string) => {
        if (!hasPref || priority === "DOESNT_MATTER") return;

        if (priority === "MUST_HAVE") {
          maxPrefScore += 50;
          if (isMatch) {
            prefScore += 50;
            if (reasonText && !reasons.includes(reasonText)) reasons.push(reasonText);
          } else {
            disqualified = true; // Hard filter rejection
          }
        } else if (priority === "IMPORTANT") {
          maxPrefScore += 25;
          if (isMatch) {
            prefScore += 25;
            if (reasonText && !reasons.includes(reasonText)) reasons.push(reasonText);
          }
        } else if (priority === "PREFERRED") {
          maxPrefScore += 10;
          if (isMatch) {
            prefScore += 10;
            if (reasonText && !reasons.includes(reasonText)) reasons.push(reasonText);
          }
        }
      };

      const checkPreferences = (pref: any, attributes: any) => {
        if (!pref) {
          return;
        }

        const hasAgePref = pref.minAge !== null || pref.maxAge !== null;
        const isAgeMatch = !!(attributes.age && (!pref.minAge || attributes.age >= pref.minAge) && (!pref.maxAge || attributes.age <= pref.maxAge));
        evaluatePref(pref.agePriority, isAgeMatch, hasAgePref, "Age preference satisfied");

        const hasHeightPref = pref.minHeight !== null || pref.maxHeight !== null;
        const isHeightMatch = !!(attributes.height && (!pref.minHeight || attributes.height >= pref.minHeight) && (!pref.maxHeight || attributes.height <= pref.maxHeight));
        evaluatePref(pref.heightPriority, isHeightMatch, hasHeightPref, "Height preference satisfied");

        const hasReligionPref = pref.religion !== null;
        const isReligionMatch = attributes.religion === pref.religion;
        evaluatePref(pref.religionPriority, isReligionMatch, hasReligionPref, "Religion matched");

        const hasCastePref = pref.caste !== null;
        const isCasteMatch = attributes.caste === pref.caste;
        evaluatePref(pref.castePriority, isCasteMatch, hasCastePref, "Caste matched");

        const hasCityPref = pref.city !== null;
        const isCityMatch = attributes.city === pref.city;
        evaluatePref(pref.cityPriority, isCityMatch, hasCityPref, "City matched");

        const hasEducationPref = pref.education !== null;
        const isEducationMatch = attributes.education === pref.education;
        evaluatePref(pref.educationPriority, isEducationMatch, hasEducationPref, "Education matched");

        const hasProfessionPref = pref.profession !== null;
        const isProfessionMatch = attributes.profession === pref.profession;
        evaluatePref(pref.professionPriority, isProfessionMatch, hasProfessionPref, "Profession matched");
      };

      // Evaluate Target -> Candidate
      checkPreferences(targetPref, candidateAttributes);

      // Drop candidate immediately if any MUST_HAVE filter is violated
      if (disqualified) continue;

      // ==========================================
      // 3. Questionnaire Scoring
      // ==========================================
      let questScore = 0;
      let maxQuestScore = 0;
      let questionnaireAligned = false;

      for (const answer of targetAnswers) {
        const candidateAnswer = candidate.answers.find(a => a.questionId === answer.questionId);
        
        let weight = 0;
        if (answer.importance === "MUST_HAVE") weight = 50;
        else if (answer.importance === "NICE_TO_HAVE") weight = 20;
        else if (answer.importance === "DOESNT_MATTER") weight = 5; // Slight bonus for serendipitous matching

        maxQuestScore += weight;

        if (candidateAnswer && candidateAnswer.selectedOptionId === answer.selectedOptionId) {
          questScore += weight;
          questionnaireAligned = true;
        }
      }

      if (questionnaireAligned) {
        reasons.push("Questionnaire answers aligned");
      }

      // ==========================================
      // 4. Final Compatibility Calculation
      // ==========================================
      const totalEarned = prefScore + questScore;
      const totalMax = maxPrefScore + maxQuestScore;
      
      // Shield against divide-by-zero if target has no preferences/answers set
      const compatibilityPercentage = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

      rankedMatches.push({
        candidateId: candidate.id,
        personName: `${candidate.person.firstName} ${candidate.person.lastName || ''}`.trim(),
        compatibilityPercentage,
        reasons,
        breakdown: {
          preferenceScore: prefScore,
          maxPreferenceScore: maxPrefScore,
          questionnaireScore: questScore,
          maxQuestionnaireScore: maxQuestScore,
          finalScore: totalEarned,
          maxFinalScore: totalMax
        }
      });
    }

    // 5. Rank Results: Highest percentage first
    rankedMatches.sort((a, b) => b.compatibilityPercentage - a.compatibilityPercentage);

    return rankedMatches.slice(0, 50); // Return Top 50 Matches
  }
}
