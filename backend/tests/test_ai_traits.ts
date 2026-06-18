import { prisma } from "../src/config/prisma.js";
import { TraitService } from "../src/modules/match/trait.service.js";

async function main() {
  console.log("🧪 Starting AI Trait Generation V2 Verification...");

  const traitService = new TraitService();

  // 1. Fetch an approved profile
  const profile = await prisma.agencyProfile.findFirst({
    where: { status: "APPROVED" },
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

  if (!profile) {
    console.error("❌ No approved profiles found in database to verify.");
    return;
  }

  console.log(`\nFound Profile: ${profile.profileNumber} (ID: ${profile.id})`);

  // 2. Evaluate deterministic traits locally
  console.log("\n1. Evaluating Deterministic Fallback Traits...");
  const deterministicTraits = traitService.calculateDeterministicTraits(profile.answers);
  console.log("Deterministic Traits Result:", JSON.stringify(deterministicTraits, null, 2));

  if (!deterministicTraits.communicationScore || !deterministicTraits.familyScore) {
    throw new Error("❌ FAIL: Deterministic traits mapping returned invalid or empty scores.");
  }
  console.log("✅ Passed local deterministic mapping checks.");

  // 3. Test generateAndStoreTraits (Gemini or Fallback)
  console.log("\n2. Generating and Storing Traits (Gemini V2 / Fallback)...");
  const storedTraits = await traitService.generateAndStoreTraits(profile.id, profile, false);
  console.log("Stored Traits Result:", JSON.stringify(storedTraits, null, 2));

  // 4. Verify stored UserTrait values in DB
  console.log("\n3. Querying stored UserTrait record from database...");
  const dbTraits = await prisma.userTrait.findUnique({
    where: { profileId: profile.id }
  });

  if (!dbTraits) {
    throw new Error("❌ FAIL: No UserTrait record found in database after generation.");
  }

  console.log("DB UserTrait Record:", JSON.stringify(dbTraits, null, 2));

  // Assert stored values match returned values
  const traitsList = [
    "communicationScore", "familyScore", "careerScore", "financialScore",
    "lifestyleScore", "emotionalScore", "traditionalScore", "parentingScore", "independenceScore"
  ];

  for (const t of traitsList) {
    if ((dbTraits as any)[t] !== (storedTraits as any)[t]) {
      throw new Error(`❌ FAIL: DB value for ${t} (${(dbTraits as any)[t]}) does not match stored returned value (${(storedTraits as any)[t]}).`);
    }
  }

  console.log("✅ Passed database persistence and match checks.");

  // 5. Verify getOrGenerateTraits (must be fast and use deterministic only, or load existing)
  console.log("\n4. Testing getOrGenerateTraits (deterministic fallback/read)...");
  
  // Delete DB traits first to test generation on-read
  await prisma.userTrait.delete({ where: { profileId: profile.id } });
  
  const readOrGenTraits = await traitService.getOrGenerateTraits(profile.id, profile);
  console.log("getOrGenerateTraits Result (fresh):", JSON.stringify(readOrGenTraits, null, 2));

  if (!readOrGenTraits) {
    throw new Error("❌ FAIL: getOrGenerateTraits failed to generate traits when DB record was missing.");
  }

  const reReadTraits = await traitService.getOrGenerateTraits(profile.id, profile);
  console.log("getOrGenerateTraits Result (cached):", JSON.stringify(reReadTraits, null, 2));
  
  console.log("✅ Passed getOrGenerateTraits checks.");
  console.log("\n🎉 ALL AI TRAIT GENERATION V2 VERIFICATIONS PASSED SUCCESSFULLY!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
