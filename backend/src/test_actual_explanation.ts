import { prisma } from "./config/prisma.js";
import { MatchService } from "./modules/match/match.service.js";

async function verifyActualMatchExplanation() {
  console.log("==================================================");
  console.log("🔍 FETCHING ACTUAL DATABASE PROFILES");
  console.log("==================================================\n");

  const profiles = await prisma.agencyProfile.findMany({
    include: {
      person: true,
      answers: {
        include: {
          question: true,
          selectedOption: true
        }
      }
    }
  });

  if (profiles.length === 0) {
    console.log("❌ No profiles found in the database. Please make sure the DB is seeded/running.");
    return;
  }

  console.log(`Found ${profiles.length} profiles in the database.`);
  for (const prof of profiles) {
    console.log(`- Profile ID: ${prof.id}, Name: ${prof.person.firstName} ${prof.person.lastName}, Answers Count: ${prof.answers.length}`);
  }

  const maleProfile = profiles.find(p => p.person.firstName.toLowerCase().includes("karthik"));
  const femaleProfile = profiles.find(p => p.person.firstName.toLowerCase().includes("anjali"));

  if (!maleProfile || !femaleProfile) {
    console.log("❌ Could not find Karthik and Anjali profiles in the database.");
    return;
  }

  // Ensure they have some matched answers and mismatched answers to test V2 mapping
  console.log("\nChecking or seeding questionnaire answers for testing actual DB profile matches...");
  const questions = await prisma.question.findMany({
    include: { options: true }
  });

  if (questions.length === 0) {
    console.log("❌ No questions found. Seeding questions first is required.");
    return;
  }

  // Ensure maleProfile and femaleProfile have answer entries in the DB
  const sampleAnswers = [
    {
      keyword: "disagreements",
      targetVal: "Discuss immediately",
      candVal: "Discuss immediately",
      importance: "NICE_TO_HAVE"
    },
    {
      keyword: "family setup",
      targetVal: "Joint family",
      candVal: "Joint family",
      importance: "NICE_TO_HAVE"
    },
    {
      keyword: "timeline for children",
      targetVal: "1-2 years",
      candVal: "1-2 years",
      importance: "NICE_TO_HAVE"
    },
    {
      keyword: "preferred lifestyle",
      targetVal: "Balanced lifestyle",
      candVal: "Balanced lifestyle",
      importance: "NICE_TO_HAVE"
    },
    {
      keyword: "spending style",
      targetVal: "Saver",
      candVal: "Spender", // mismatch
      importance: "NICE_TO_HAVE"
    }
  ];

  for (const sample of sampleAnswers) {
    const q = questions.find(question => {
      const qText = question.questionText.toLowerCase();
      return qText.includes(sample.keyword);
    });

    if (q) {
      const targetOpt = q.options.find(o => o.optionText.toLowerCase().includes(sample.targetVal.toLowerCase()));
      const candOpt = q.options.find(o => o.optionText.toLowerCase().includes(sample.candVal.toLowerCase()));

      if (targetOpt && candOpt) {
        // Upsert target answer
        await prisma.profileAnswer.upsert({
          where: {
            profileId_questionId: {
              profileId: maleProfile.id,
              questionId: q.id
            }
          },
          update: { selectedOptionId: targetOpt.id, importance: sample.importance as any },
          create: {
            profileId: maleProfile.id,
            questionId: q.id,
            selectedOptionId: targetOpt.id,
            importance: sample.importance as any
          }
        });

        // Upsert candidate answer
        await prisma.profileAnswer.upsert({
          where: {
            profileId_questionId: {
              profileId: femaleProfile.id,
              questionId: q.id
            }
          },
          update: { selectedOptionId: candOpt.id, importance: sample.importance as any },
          create: {
            profileId: femaleProfile.id,
            questionId: q.id,
            selectedOptionId: candOpt.id,
            importance: sample.importance as any
          }
        });
      }
    }
  }

  console.log("✅ Answers upserted for profiles.");

  // Re-run search matches on maleProfile
  console.log(`\nRunning matchmaking search for ${maleProfile.person.firstName}...`);
  const matchService = new MatchService();
  const results = await matchService.searchMatches(maleProfile.id);

  console.log(`\nMatch results count: ${results.length}`);
  const matchWithFemale = results.find(r => r.candidateId === femaleProfile.id);

  if (!matchWithFemale) {
    console.log("❌ Could not find matchmaking result between the seeded profiles.");
    return;
  }

  console.log("\n==================================================");
  console.log("🎯 ACTUAL DB PROFILE MATCH COMPATIBILITY EXPLANATION V2");
  console.log("==================================================");
  console.log(`Match Compatibility Score: ${matchWithFemale.finalScore}%`);
  console.log(`Match Confidence Score: ${matchWithFemale.confidenceScore}%`);
  console.log(`\n--- Generated AI Match Explanation String ---\n`);
  console.log(matchWithFemale.aiExplanation);
  console.log(`\n--- Generated Conversation Starters ---\n`);
  console.log(matchWithFemale.conversationStarters);
  console.log("\n==================================================");
}

verifyActualMatchExplanation()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
