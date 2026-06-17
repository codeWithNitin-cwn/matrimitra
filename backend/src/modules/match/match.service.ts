import { MatchRepository } from "./match.repository.js";
import { prisma } from "../../config/prisma.js";
import { generateAIExplanation, generateProfileSummary, generateConversationStarters, generateProposalRecommendation } from "../../integrations/gemini.js";
import { TraitService } from "./trait.service.js";

// Helper to calculate age from Date of Birth
function calculateAge(dob: any): number | null {
  if (!dob) return null;
  const dobDate = dob instanceof Date ? dob : new Date(dob);
  if (isNaN(dobDate.getTime())) return null;
  const diff = Date.now() - dobDate.getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}

// Helper for normalized/contains-based string matching
function isMatchNormalized(candidateValue: string | null, preferenceValue: string | null): boolean {
  if (!candidateValue || !preferenceValue) return false;
  const normCand = candidateValue.toLowerCase().trim();
  const normPref = preferenceValue.toLowerCase().trim();
  return normCand.includes(normPref) || normPref.includes(normCand);
}

function calculateLifestyleScore(target: any, candidate: any): number {
  const tLife = target.lifestyles?.[0];
  const cLife = candidate.lifestyles?.[0];
  if (!tLife || !cLife) return 50;

  let score = 0;
  let maxScore = 0;

  if (tLife.foodHabit && cLife.foodHabit) {
    maxScore += 10;
    const tFood = tLife.foodHabit.toLowerCase();
    const cFood = cLife.foodHabit.toLowerCase();
    if (tFood === cFood) {
      score += 10;
    } else if (
      (tFood.includes("veg") && cFood.includes("veg")) ||
      (tFood.includes("vegan") && cFood.includes("veg"))
    ) {
      score += 7;
    } else {
      score += 2;
    }
  }

  if (tLife.smoking !== null && cLife.smoking !== null) {
    maxScore += 10;
    if (tLife.smoking === cLife.smoking) {
      score += 10;
    }
  }

  if (tLife.drinking !== null && cLife.drinking !== null) {
    maxScore += 10;
    if (tLife.drinking === cLife.drinking) {
      score += 10;
    } else {
      score += 3;
    }
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 50;
}

function calculateEducationCareerScore(target: any, candidate: any): number | null {
  const tEdu = target.educations?.[0];
  const cEdu = candidate.educations?.[0];
  const tCar = target.careers?.[0];
  const cCar = candidate.careers?.[0];

  let score = 0;
  let maxScore = 0;

  if (tEdu && cEdu) {
    if (tEdu.qualification && tEdu.qualification !== "N/A" && cEdu.qualification && cEdu.qualification !== "N/A") {
      maxScore += 5;
      const tQual = tEdu.qualification.toLowerCase();
      const cQual = cEdu.qualification.toLowerCase();
      if (tQual === cQual || tQual.includes(cQual) || cQual.includes(tQual)) {
        score += 5;
      } else if (
        (tQual.includes("tech") && cQual.includes("tech")) ||
        (tQual.includes("mba") && cQual.includes("mba"))
      ) {
        score += 4;
      }
    }
    if (tEdu.specialization && tEdu.specialization !== "N/A" && cEdu.specialization && cEdu.specialization !== "N/A") {
      maxScore += 5;
      const tSpec = tEdu.specialization.toLowerCase();
      const cSpec = cEdu.specialization.toLowerCase();
      if (tSpec === cSpec || tSpec.includes(cSpec) || cSpec.includes(tSpec)) {
        score += 5;
      }
    }
  }

  if (tCar && cCar) {
    if (tCar.profession && tCar.profession !== "N/A" && cCar.profession && cCar.profession !== "N/A") {
      maxScore += 5;
      const tProf = tCar.profession.toLowerCase();
      const cProf = cCar.profession.toLowerCase();
      if (tProf === cProf || tProf.includes(cProf) || cProf.includes(tProf)) {
        score += 5;
      }
    }
    if (tCar.workLocation && tCar.workLocation !== "N/A" && cCar.workLocation && cCar.workLocation !== "N/A") {
      maxScore += 5;
      if (tCar.workLocation.toLowerCase() === cCar.workLocation.toLowerCase()) {
        score += 5;
      }
    }
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : null;
}



function generateTraitBasedExplanations(tTraits: any, cTraits: any, score: number) {
  const strengths: string[] = [];
  const concerns: string[] = [];

  const traitKeys = [
    { key: "communicationScore", label: "communication compatibility", plural: "communication styles", name: "Communication" },
    { key: "familyScore", label: "family expectations", plural: "family expectations", name: "Family Setup" },
    { key: "financialScore", label: "financial habits", plural: "financial habits", name: "Financial Habits" },
    { key: "parentingScore", label: "parenting expectations", plural: "parenting expectations", name: "Parenting" },
    { key: "careerScore", label: "career priorities", plural: "career priorities", name: "Career" },
    { key: "traditionalScore", label: "traditional values", plural: "traditional values", name: "Traditional Values" },
    { key: "independenceScore", label: "future goals", plural: "future vision", name: "Future Vision" }
  ];

  let hasSignificantMismatch = false;
  for (const trait of traitKeys) {
    const targetVal = tTraits?.[trait.key];
    const candidateVal = cTraits?.[trait.key];
    if (targetVal !== null && targetVal !== undefined && candidateVal !== null && candidateVal !== undefined) {
      const diff = Math.abs(targetVal - candidateVal);
      if (diff > 3) {
        hasSignificantMismatch = true;
      }
    }
  }

  // Generate strengths (only if both are not null)
  // Communication style
  if (tTraits.communicationScore !== null && cTraits.communicationScore !== null &&
      Math.abs(tTraits.communicationScore - cTraits.communicationScore) <= 2 && tTraits.communicationScore >= 6) {
    strengths.push("Strong communication compatibility");
  }
  // Family expectations
  if (tTraits.familyScore !== null && cTraits.familyScore !== null &&
      Math.abs(tTraits.familyScore - cTraits.familyScore) <= 2) {
    strengths.push("Similar family expectations");
  }
  // Financial habits
  if (tTraits.financialScore !== null && cTraits.financialScore !== null &&
      Math.abs(tTraits.financialScore - cTraits.financialScore) <= 2) {
    strengths.push("Similar financial habits");
  }
  // Parenting expectations
  if (tTraits.parentingScore !== null && cTraits.parentingScore !== null &&
      Math.abs(tTraits.parentingScore - cTraits.parentingScore) <= 2) {
    strengths.push("Similar parenting expectations");
  }
  // Future vision/goals
  if (tTraits.independenceScore !== null && cTraits.independenceScore !== null &&
      Math.abs(tTraits.independenceScore - cTraits.independenceScore) <= 2) {
    strengths.push("Shared future goals");
  }
  // Career priorities
  if (tTraits.careerScore !== null && cTraits.careerScore !== null &&
      Math.abs(tTraits.careerScore - cTraits.careerScore) <= 2) {
    strengths.push("Aligned career priorities");
  }
  // Traditional values
  if (tTraits.traditionalScore !== null && cTraits.traditionalScore !== null &&
      Math.abs(tTraits.traditionalScore - cTraits.traditionalScore) <= 2) {
    strengths.push("Aligned traditional values");
  }

  // Concern generation based on requirements
  if (score >= 90 && !hasSignificantMismatch) {
    concerns.push("No significant compatibility concerns identified.");
  } else {
    // Only generate concerns when actual trait differences exceed threshold (diff >= 2)
    for (const trait of traitKeys) {
      const targetVal = tTraits?.[trait.key];
      const candidateVal = cTraits?.[trait.key];
      if (targetVal !== null && targetVal !== undefined && candidateVal !== null && candidateVal !== undefined) {
        const diff = Math.abs(targetVal - candidateVal);
        if (diff >= 4) {
          if (trait.key === "communicationScore") concerns.push("Communication style mismatch");
          else if (trait.key === "familyScore") concerns.push("Different family setup preferences");
          else if (trait.key === "financialScore") concerns.push("Financial habits differ significantly");
          else if (trait.key === "parentingScore") concerns.push("Different children plans");
          else if (trait.key === "careerScore") concerns.push("Career priorities differ significantly");
          else if (trait.key === "traditionalScore") concerns.push("Traditional values differ significantly");
          else if (trait.key === "independenceScore") concerns.push("Different future goals and vision");
        } else if (diff === 3) {
          concerns.push(`Moderate difference in ${trait.plural}`);
        } else if (diff === 2) {
          concerns.push(`Slight difference in ${trait.plural}`);
        }
      }
    }
  }

  if (strengths.length === 0) {
    if (tTraits.emotionalScore !== null && cTraits.emotionalScore !== null &&
        Math.abs(tTraits.emotionalScore - cTraits.emotionalScore) <= 2) {
      strengths.push("Compatible emotional expectations");
    }
    if (tTraits.lifestyleScore !== null && cTraits.lifestyleScore !== null &&
        Math.abs(tTraits.lifestyleScore - cTraits.lifestyleScore) <= 2) {
      strengths.push("Compatible lifestyle pace");
    }
    if (strengths.length === 0) {
      strengths.push("Shared baseline compatibility");
    }
  }

  if (concerns.length === 0) {
    concerns.push("No significant compatibility concerns identified.");
  }

  return { strengths, concerns };
}

export class MatchService {
  private repository: MatchRepository;
  private traitService: TraitService;

  constructor() {
    this.repository = new MatchRepository();
    this.traitService = new TraitService();
  }

  async searchMatches(profileId: string) {
    const targetProfile = await this.repository.getProfileWithPreferencesAndAnswers(profileId);
    if (!targetProfile) {
      throw new Error("Target profile does not exist");
    }
    if (targetProfile.status !== "ACTIVE") {
      throw new Error("Match search is only available for ACTIVE profiles");
    }

    // Fetch or generate target traits deterministically if missing
    const targetTraits = await this.traitService.getOrGenerateTraits(profileId, targetProfile);

    const targetPref = targetProfile.preferences[0];
    const targetAnswers = targetProfile.answers;

    const targetGender = targetProfile.person.gender;
    const oppositeGender = targetGender.toUpperCase() === "MALE" || targetGender.toLowerCase() === "male" ? "FEMALE" : "MALE";
    
    const occupiedProfileIds = await this.repository.getOccupiedProfileIds();
    const candidates = await this.repository.getCandidateProfiles(profileId, oppositeGender, occupiedProfileIds);
    const rankedMatches = [];

    // Batch-load candidate traits to avoid N+1 database queries
    const candidateIds = candidates.map(c => c.id);
    const candidateTraitsList = await prisma.userTrait.findMany({
      where: { profileId: { in: candidateIds } }
    });

    // Target (Source) attributes for target->source preference matching
    const targetAttributes = {
      age: calculateAge(targetProfile.person.dob),
      height: targetProfile.personal?.heightCm || null,
      religion: targetProfile.personal?.religion || null,
      caste: targetProfile.personal?.caste || null,
      city: targetProfile.personal?.city || null,
      education: targetProfile.educations[0]?.qualification || null,
      profession: targetProfile.careers[0]?.profession || null,
      smoking: targetProfile.lifestyles?.[0]?.smoking ?? null,
      drinking: targetProfile.lifestyles?.[0]?.drinking ?? null,
      children: targetProfile.answers.find(a => a.question?.questionText?.toLowerCase().includes("want children"))?.selectedOption?.optionText || null,
      familySetup: targetProfile.answers.find(a => a.question?.questionText?.toLowerCase().includes("family setup"))?.selectedOption?.optionText || null,
      relocation: targetProfile.answers.find(a => {
        const txt = a.question?.questionText?.toLowerCase() || "";
        return txt.includes("relocate") || txt.includes("settle");
      })?.selectedOption?.optionText || null,
    };

    // Query total active questions for confidence score calculation
    const totalQuestions = await prisma.question.count({ where: { isActive: true } }) || 1;

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
        smoking: candidate.lifestyles?.[0]?.smoking ?? null,
        drinking: candidate.lifestyles?.[0]?.drinking ?? null,
        children: candidate.answers.find(a => a.question?.questionText?.toLowerCase().includes("want children"))?.selectedOption?.optionText || null,
        familySetup: candidate.answers.find(a => a.question?.questionText?.toLowerCase().includes("family setup"))?.selectedOption?.optionText || null,
        relocation: candidate.answers.find(a => {
          const txt = a.question?.questionText?.toLowerCase() || "";
          return txt.includes("relocate") || txt.includes("settle");
        })?.selectedOption?.optionText || null,
      };

      // Check Questionnaire MUST_HAVE deal breakers
      let dealBreakerViolated = false;
      let rejectedReason = "";
      for (const targetAns of targetAnswers) {
        if (targetAns.importance === "MUST_HAVE") {
          const qText = targetAns.question?.questionText?.toLowerCase() || "";
          
          const isSmokingDB = qText.includes("smoking");
          const isDrinkingDB = qText.includes("drinking");
          const isChildrenDB = qText.includes("children");
          const isFamilySetupDB = qText.includes("family setup");
          const isRelocationDB = qText.includes("relocate") || qText.includes("settle");
          
          if (isSmokingDB || isDrinkingDB || isChildrenDB || isFamilySetupDB || isRelocationDB) {
            const candAns = candidate.answers.find(a => a.questionId === targetAns.questionId);
            if (!candAns || candAns.selectedOptionId !== targetAns.selectedOptionId) {
              dealBreakerViolated = true;
              let conflictType = "Questionnaire conflict";
              if (isSmokingDB) conflictType = "Smoking conflict";
              else if (isDrinkingDB) conflictType = "Drinking conflict";
              else if (isChildrenDB) conflictType = "Children preference conflict";
              else if (isFamilySetupDB) conflictType = "Family setup conflict";
              else if (isRelocationDB) conflictType = "Relocation conflict";
              rejectedReason = `${conflictType} (MUST_HAVE)`;
              break;
            }
          }
        }
      }

      if (dealBreakerViolated) {
        console.log(`[Deal Breaker] Candidate ${candidate.profileNumber} rejected for Source ${targetProfile.profileNumber}: Rejected: ${rejectedReason}`);
        continue; // REJECT candidate
      }

      // ==========================================
      // STAGE 1: Candidate Discovery & Hard Filters (Two-Way Evaluation)
      // ==========================================
      const calculateDirectionalPrefScore = (pref: any, attributes: any) => {
        let currentPrefScore = 0;
        let currentMaxPrefScore = 0;
        let currentDisqualified = false;
        let disqualificationReason = "";

        const evaluatePref = (priority: string, isMatch: boolean, hasPref: boolean, fieldName: string) => {
          if (!hasPref || priority === "DOESNT_MATTER") return;

          if (priority === "MUST_HAVE") {
            currentMaxPrefScore += 50;
            if (isMatch) {
              currentPrefScore += 50;
            } else {
              currentDisqualified = true;
              disqualificationReason = `${fieldName} conflict (MUST_HAVE)`;
            }
          } else if (priority === "IMPORTANT") {
            currentMaxPrefScore += 25;
            if (isMatch) {
              currentPrefScore += 25;
            }
          } else if (priority === "PREFERRED") {
            currentMaxPrefScore += 10;
            if (isMatch) {
              currentPrefScore += 10;
            }
          }
        };
        if (pref) {
          const hasAgePref = pref.minAge !== null || pref.maxAge !== null;
          const isAgeMatch = !!(attributes.age && (!pref.minAge || attributes.age >= pref.minAge) && (!pref.maxAge || attributes.age <= pref.maxAge));
          evaluatePref(pref.agePriority, isAgeMatch, hasAgePref, "Age range");

          const hasHeightPref = pref.minHeight !== null || pref.maxHeight !== null;
          const isHeightMatch = !!(attributes.height && (!pref.minHeight || attributes.height >= pref.minHeight) && (!pref.maxHeight || attributes.height <= pref.maxHeight));
          evaluatePref(pref.heightPriority, isHeightMatch, hasHeightPref, "Height range");

          const hasReligionPref = pref.religion !== null && pref.religion !== "";
          const isReligionMatch = isMatchNormalized(attributes.religion, pref.religion);
          evaluatePref(pref.religionPriority, isReligionMatch, hasReligionPref, "Religion");

          const hasCastePref = pref.caste !== null && pref.caste !== "";
          const isCasteMatch = isMatchNormalized(attributes.caste, pref.caste);
          evaluatePref(pref.castePriority, isCasteMatch, hasCastePref, "Caste");

          const hasCityPref = pref.city !== null && pref.city !== "";
          const isCityMatch = isMatchNormalized(attributes.city, pref.city);
          evaluatePref(pref.cityPriority, isCityMatch, hasCityPref, "City");

          const hasEducationPref = pref.education !== null && pref.education !== "";
          const isEducationMatch = isMatchNormalized(attributes.education, pref.education);
          evaluatePref(pref.educationPriority, isEducationMatch, hasEducationPref, "Education");

          const hasProfessionPref = pref.profession !== null && pref.profession !== "";
          const isProfessionMatch = isMatchNormalized(attributes.profession, pref.profession);
          evaluatePref(pref.professionPriority, isProfessionMatch, hasProfessionPref, "Profession");

          // Smoking preference
          const hasSmokingPref = pref.smokingPreference !== null && pref.smokingPreference !== undefined;
          const isSmokingMatch = attributes.smoking === pref.smokingPreference;
          evaluatePref(pref.smokingPriority, isSmokingMatch, hasSmokingPref, "Smoking");

          // Drinking preference
          const hasDrinkingPref = pref.drinkingPreference !== null && pref.drinkingPreference !== undefined;
          const isDrinkingMatch = attributes.drinking === pref.drinkingPreference;
          evaluatePref(pref.drinkingPriority, isDrinkingMatch, hasDrinkingPref, "Drinking");

          // Children preference
          const hasChildrenPref = pref.childrenPreference !== null && pref.childrenPreference !== "";
          const isChildrenMatch = isMatchNormalized(attributes.children, pref.childrenPreference);
          evaluatePref(pref.childrenPriority, isChildrenMatch, hasChildrenPref, "Children preference");

          // Family Setup preference
          const hasFamilySetupPref = pref.familySetupPreference !== null && pref.familySetupPreference !== "";
          const isFamilySetupMatch = isMatchNormalized(attributes.familySetup, pref.familySetupPreference);
          evaluatePref(pref.familySetupPriority, isFamilySetupMatch, hasFamilySetupPref, "Family setup");

          // Relocation preference
          const hasRelocationPref = pref.relocationPreference !== null && pref.relocationPreference !== "";
          const isRelocationMatch = isMatchNormalized(attributes.relocation, pref.relocationPreference);
          evaluatePref(pref.relocationPriority, isRelocationMatch, hasRelocationPref, "Relocation willingness");
        }

        return {
          score: currentPrefScore,
          maxScore: currentMaxPrefScore,
          disqualified: currentDisqualified,
          reason: disqualificationReason
        };
      };

      // 1. Source -> Target
      const sourceToTargetRes = calculateDirectionalPrefScore(targetPref, candidateAttributes);
      
      // 2. Target -> Source
      const targetToSourceRes = calculateDirectionalPrefScore(candidatePref, targetAttributes);

      // If either violates a MUST_HAVE, disqualify candidate
      if (sourceToTargetRes.disqualified) {
        console.log(`[Deal Breaker] Candidate ${candidate.profileNumber} rejected for Source ${targetProfile.profileNumber}: Rejected: ${sourceToTargetRes.reason} (Source -> Target preference conflict)`);
        continue;
      }
      if (targetToSourceRes.disqualified) {
        console.log(`[Deal Breaker] Candidate ${candidate.profileNumber} rejected for Source ${targetProfile.profileNumber}: Rejected: ${targetToSourceRes.reason} (Target -> Source preference conflict)`);
        continue;
      }

      // Mutual preference score calculation (average of both directions)
      const sourceToTargetScorePercent = sourceToTargetRes.maxScore > 0 ? (sourceToTargetRes.score / sourceToTargetRes.maxScore) * 100 : 100;
      const targetToSourceScorePercent = targetToSourceRes.maxScore > 0 ? (targetToSourceRes.score / targetToSourceRes.maxScore) * 100 : 100;
      
      const filterScorePercent = Math.round((sourceToTargetScorePercent + targetToSourceScorePercent) / 2);
      const weightedFilterScore = filterScorePercent * 0.4;

      // ==========================================
      // STAGE 2: Compatibility Engine V2 (Weighted)
      // ==========================================

      // Confidence score based on candidate questionnaire completion rate
      const confidenceScore = Math.round((candidate.answers.length / totalQuestions) * 100);

      // Fetch or generate candidate traits (deterministic fallback if missing)
      let candidateTraits = candidateTraitsList.find(t => t.profileId === candidate.id);
      if (!candidateTraits) {
        candidateTraits = await this.traitService.getOrGenerateTraits(candidate.id, candidate);
      }

      // Compare Questionnaire via traits (exclude unanswered traits containing null)
      let traitMatchSum = 0;
      let activeTraitCount = 0;
      const traitKeys = [
        "communicationScore", "familyScore", "careerScore", "financialScore", 
        "lifestyleScore", "emotionalScore", "traditionalScore", "parentingScore", "independenceScore"
      ];
      for (const key of traitKeys) {
        const targetVal = (targetTraits as any)[key];
        const candidateVal = (candidateTraits as any)[key];
        if (targetVal !== null && targetVal !== undefined && candidateVal !== null && candidateVal !== undefined) {
          const diff = Math.abs(targetVal - candidateVal);
          traitMatchSum += (10 - diff) * 10;
          activeTraitCount++;
        }
      }
      const questionnaireScorePercent = activeTraitCount > 0 ? Math.round(traitMatchSum / activeTraitCount) : 50;
      const weightedQuestScore = questionnaireScorePercent * 0.4;

      // 3. Lifestyle Score (10%)
      const lifestyleScorePercent = calculateLifestyleScore(targetProfile, candidate);
      const weightedLifestyleScore = lifestyleScorePercent * 0.1;

      // 4. Education/Career Score (10%)
      const educationCareerScorePercent = calculateEducationCareerScore(targetProfile, candidate);
      
      let finalScore = 0;
      if (educationCareerScorePercent === null) {
        // Normalize: distribute 10% weight of missing Education/Career score across remaining components
        const rawFinalScore = Math.round(
          (weightedFilterScore + weightedQuestScore + weightedLifestyleScore) / 0.9
        );
        finalScore = Math.min(95, rawFinalScore);
      } else {
        const weightedEduCareerScore = educationCareerScorePercent * 0.1;
        const rawFinalScore = Math.round(
          weightedFilterScore + weightedQuestScore + weightedLifestyleScore + weightedEduCareerScore
        );
        finalScore = Math.min(95, rawFinalScore);
      }

      // Strengths & Concerns Explanation Generation from Traits (Deterministic first)
      const { strengths: detStrengths, concerns: detConcerns } = generateTraitBasedExplanations(targetTraits, candidateTraits, finalScore);

      // Call Gemini for AI explanations
      let strengths = detStrengths;
      let concerns = detConcerns;
      let aiExplanation = "";

      try {
        aiExplanation = await generateAIExplanation(
          targetProfile,
          candidate,
          targetTraits,
          candidateTraits,
          finalScore,
          confidenceScore,
          detStrengths,
          detConcerns,
          true // forceFallback = true during searchMatches loop to prevent latency/Gemini API calls
        );
      } catch (err) {
        console.error("Failed to run Gemini AI explanation:", err);
        const targetName = targetProfile.person?.firstName || "The client";
        const candidateName = candidate.person?.firstName || "the candidate";
        aiExplanation = `${targetName} and ${candidateName} show baseline compatibility with a compatibility score of ${finalScore}%. Further conversations can help assess compatibility on family values, career planning, and communication preferences.`;
      }

      // Save / Update CompatibilityResult in DB
      await prisma.compatibilityResult.upsert({
        where: {
          sourceProfileId_targetProfileId: {
            sourceProfileId: profileId,
            targetProfileId: candidate.id
          }
        },
        update: {
          compatibilityScore: finalScore,
          filterScore: Math.round(filterScorePercent),
          questionnaireScore: Math.round(questionnaireScorePercent),
          lifestyleScore: Math.round(lifestyleScorePercent),
          educationCareerScore: educationCareerScorePercent,
          strengths,
          concerns,
          aiExplanation,
          confidenceScore,
          generatedAt: new Date()
        },
        create: {
          sourceProfileId: profileId,
          targetProfileId: candidate.id,
          compatibilityScore: finalScore,
          filterScore: Math.round(filterScorePercent),
          questionnaireScore: Math.round(questionnaireScorePercent),
          lifestyleScore: Math.round(lifestyleScorePercent),
          educationCareerScore: educationCareerScorePercent,
          strengths,
          concerns,
          aiExplanation,
          confidenceScore
        }
      });

      const candidateSummary = await generateProfileSummary(candidate, true);

      let conversationStarters: string[] = [];
      try {
        conversationStarters = await generateConversationStarters(
          targetProfile,
          candidate,
          strengths,
          concerns
        );
      } catch (err) {
        console.error("Failed to generate conversation starters:", err);
        conversationStarters = [
          "How do you envision balancing career responsibilities and personal life goals after marriage?",
          "What is your expectation regarding family involvement in major life decisions?",
          "How do you prefer to spend weekends and plan your future lifestyle pace together?"
        ];
      }

      const proposalRecommendation = await generateProposalRecommendation(
        targetProfile,
        candidate,
        finalScore,
        confidenceScore,
        strengths,
        concerns,
        aiExplanation,
        true // forceDeterministic = true during searchMatches loop to prevent latency/Gemini API calls
      );

      const isOwnAgency = candidate.agencyId === targetProfile.agencyId;
      const isAccepted = await prisma.proposal.findFirst({
        where: {
          proposalStatus: "ACCEPTED",
          OR: [
            { brideProfileId: candidate.id },
            { groomProfileId: candidate.id }
          ],
          AND: {
            OR: [
              { senderAgencyId: targetProfile.agencyId },
              { receiverAgencyId: targetProfile.agencyId }
            ]
          }
        }
      });
      const showFullDetails = isOwnAgency || !!isAccepted;

      rankedMatches.push({
        candidateId: candidate.id,
        personName: showFullDetails ? `${candidate.person.firstName} ${candidate.person.lastName || ''}`.trim() : "Partner Client",
        isOwnAgency,
        showFullDetails,
        filterScore: Math.round(filterScorePercent),
        compatibilityScore: Math.round(questionnaireScorePercent),
        lifestyleScore: Math.round(lifestyleScorePercent),
        educationCareerScore: educationCareerScorePercent,
        finalScore,
        strengths: showFullDetails ? strengths : [],
        concerns: showFullDetails ? concerns : [],
        aiExplanation: showFullDetails ? aiExplanation : "Detailed AI explanation is hidden until proposal acceptance.",
        aiSummary: showFullDetails ? candidateSummary : "",
        confidenceScore,
        conversationStarters: showFullDetails ? conversationStarters : [],
        proposalRecommendation: showFullDetails ? proposalRecommendation : null,
        age: candidateAttributes.age,
        city: candidateAttributes.city,
        religion: candidateAttributes.religion,
        education: candidateAttributes.education,
        profession: candidateAttributes.profession,
        traits: showFullDetails ? candidateTraits : null,
        targetTraits,
        sourceToTargetPrefScore: Math.round(sourceToTargetScorePercent),
        targetToSourcePrefScore: Math.round(targetToSourceScorePercent)
      });
    }

    // Rank by Own Agency first, then by Final Score
    rankedMatches.sort((a, b) => {
      if (a.isOwnAgency !== b.isOwnAgency) {
        return a.isOwnAgency ? -1 : 1;
      }
      const aRankScore = a.finalScore * (0.8 + 0.2 * (a.confidenceScore / 100));
      const bRankScore = b.finalScore * (0.8 + 0.2 * (b.confidenceScore / 100));
      return bRankScore - aRankScore;
    });

    return rankedMatches.slice(0, 50);
  }

  async getProposalRecommendation(profileId: string, candidateId: string) {
    const targetProfile = await this.repository.getProfileWithPreferencesAndAnswers(profileId);
    if (!targetProfile) {
      throw new Error("Target profile does not exist");
    }

    const candidate = await this.repository.getProfileWithPreferencesAndAnswers(candidateId);
    if (!candidate) {
      throw new Error("Candidate profile not found");
    }

    const compat = await prisma.compatibilityResult.findUnique({
      where: {
        sourceProfileId_targetProfileId: {
          sourceProfileId: profileId,
          targetProfileId: candidateId
        }
      }
    });

    if (!compat) {
      throw new Error("Compatibility result not found. Run matchmaking search first.");
    }

    // Load or generate traits for both target and candidate to run on-demand explanation
    const targetTraits = await this.traitService.getOrGenerateTraits(profileId, targetProfile);
    const candidateTraits = await this.traitService.getOrGenerateTraits(candidateId, candidate);

    // Generate detailed dynamic AI explanation on-demand
    let detailedExplanation = compat.aiExplanation || "";
    try {
      detailedExplanation = await generateAIExplanation(
        targetProfile,
        candidate,
        targetTraits,
        candidateTraits,
        compat.compatibilityScore,
        compat.confidenceScore,
        compat.strengths as string[],
        compat.concerns as string[],
        false // forceFallback = false for live on-demand Gemini execution
      );

      // Save/cache detailed explanation in DB
      await prisma.compatibilityResult.update({
        where: {
          sourceProfileId_targetProfileId: {
            sourceProfileId: profileId,
            targetProfileId: candidateId
          }
        },
        data: {
          aiExplanation: detailedExplanation
        }
      });
    } catch (err) {
      console.error("Failed to generate dynamic AI explanation on-demand:", err);
    }

    const recommendation = await generateProposalRecommendation(
      targetProfile,
      candidate,
      compat.compatibilityScore,
      compat.confidenceScore,
      compat.strengths as string[],
      compat.concerns as string[],
      detailedExplanation,
      false // forceDeterministic = false to run on-demand Gemini recommendation
    );

    return {
      ...recommendation,
      aiExplanation: detailedExplanation
    };
  }
}
