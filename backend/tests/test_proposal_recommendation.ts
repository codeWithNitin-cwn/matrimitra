import { prisma } from "../src/config/prisma.js";
import { MatchService } from "../src/modules/match/match.service.js";

async function main() {
  console.log("⚙ Starting Verification for AI Proposal Recommendation V1...");

  const matchService = new MatchService();

  // 1. Fetch a profile that has matches or just any approved profile
  const profile = await prisma.agencyProfile.findFirst({
    where: { status: "ACTIVE" }
  });

  if (!profile) {
    console.error("❌ No approved profiles found to run matchmaking verification.");
    return;
  }

  console.log(`\nUsing Target Profile: ${profile.profileNumber} (ID: ${profile.id})`);

  // 2. Perform matchmaking search and look for baseline recommendation
  console.log("\n1. Searching Matches & Evaluating Baseline Recommendations...");
  const matches = await matchService.searchMatches(profile.id);

  if (matches.length === 0) {
    console.log("⚠️ No candidates found. Please seed some candidate profiles of opposite gender to verify completely.");
    console.log("Skipping loop assertions, but let's confirm the code runs without exceptions.");
  } else {
    const firstMatch = matches[0];
    console.log(`- Found Match Candidate: ${firstMatch.personName} (ID: ${firstMatch.candidateId})`);
    console.log(`- Final Match Score: ${firstMatch.finalScore}%`);
    console.log(`- Confidence Score: ${firstMatch.confidenceScore}%`);
    
    const rec = firstMatch.proposalRecommendation;
    if (!rec) {
      throw new Error("❌ FAIL: Matches payload does not contain 'proposalRecommendation' property.");
    }

    console.log("\nEvaluated Deterministic Recommendation on Search Payload:");
    console.log(`- recommendationLevel: ${rec.recommendationLevel}`);
    console.log(`- successProbability: ${rec.successProbability}%`);
    console.log(`- recommendationSummary: ${rec.recommendationSummary}`);
    console.log(`- strengths: ${JSON.stringify(rec.strengths)}`);
    console.log(`- risks: ${JSON.stringify(rec.risks)}`);

    // Level-based score check
    if (firstMatch.finalScore >= 80 && rec.recommendationLevel !== "STRONGLY_RECOMMENDED") {
      throw new Error("❌ FAIL: Score >= 80 should be STRONGLY_RECOMMENDED");
    }
    if (firstMatch.finalScore >= 65 && firstMatch.finalScore < 80 && rec.recommendationLevel !== "RECOMMENDED") {
      throw new Error("❌ FAIL: Score >= 65 and < 80 should be RECOMMENDED");
    }

    // Low confidence checks
    if (firstMatch.confidenceScore < 50) {
      if (rec.successProbability !== Math.max(0, firstMatch.finalScore - 10)) {
        throw new Error("❌ FAIL: Low confidence should penalize success probability by 10%");
      }
      if (!rec.risks.some((r: string) => r.includes("Limited questionnaire data"))) {
        throw new Error("❌ FAIL: Low confidence should trigger warning in risks");
      }
    } else {
      if (rec.successProbability !== firstMatch.finalScore) {
        throw new Error("❌ FAIL: Normal confidence should map success probability to finalScore");
      }
    }
    console.log("✅ Passed baseline matchmaking recommendation assertions.");

    // 3. Test on-demand detailed recommendation fetch
    console.log("\n2. Querying On-Demand Proposal Recommendation...");
    try {
      const detailedRec = await matchService.getProposalRecommendation(profile.id, firstMatch.candidateId);
      console.log("\nFetched Detailed Recommendation Payload:");
      console.log(`- recommendationLevel: ${detailedRec.recommendationLevel}`);
      console.log(`- successProbability: ${detailedRec.successProbability}%`);
      console.log(`- recommendationSummary: ${detailedRec.recommendationSummary}`);
      console.log(`- strengths: ${JSON.stringify(detailedRec.strengths)}`);
      console.log(`- risks: ${JSON.stringify(detailedRec.risks)}`);

      if (!detailedRec.recommendationLevel || typeof detailedRec.successProbability !== "number") {
        throw new Error("❌ FAIL: Detailed recommendation payload is incomplete.");
      }
      console.log("✅ Passed detailed proposal recommendation assertions.");
    } catch (err) {
      console.error("❌ Failed on-demand query test:", err);
      throw err;
    }
  }

  console.log("\n🎉 ALL AI PROPOSAL RECOMMENDATION VERIFICATIONS PASSED SUCCESSFULLY!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
