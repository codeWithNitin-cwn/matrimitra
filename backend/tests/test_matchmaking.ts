import { MatchService } from "../src/modules/match/match.service.js";
import { prisma } from "../src/config/prisma.js";

async function test() {
  console.log("Starting matchmaking test...");

  // Find an ACTIVE profile
  const profile = await prisma.agencyProfile.findFirst({
    where: { status: "ACTIVE" },
    include: { person: true }
  });

  if (!profile) {
    console.error("No ACTIVE profile found to run matchmaking test.");
    process.exit(1);
  }

  console.log(`Running match search for: ${profile.person.firstName} ${profile.person.lastName} (${profile.profileNumber})`);

  const matchService = new MatchService();
  try {
    const results = await matchService.searchMatches(profile.id);
    console.log(`Matchmaking search succeeded! Found ${results.length} matches.`);
    if (results.length > 0) {
      console.log("All matches details:");
      results.forEach((m, idx) => {
        console.log(`${idx + 1}. Candidate: ${m.personName}, Score: ${m.finalScore}%, Own Agency: ${m.isOwnAgency}`);
      });
    }
    console.log("TEST PASSED!");
  } catch (error) {
    console.error("TEST FAILED! Matchmaking search threw an error:", error);
    process.exit(1);
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
