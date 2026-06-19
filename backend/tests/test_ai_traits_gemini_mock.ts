import { GoogleGenerativeAI } from "@google/generative-ai";

// Mock GoogleGenerativeAI prototype before anything runs
GoogleGenerativeAI.prototype.getGenerativeModel = function(options: any) {
  console.log(`[Mock Gemini] getGenerativeModel called with model: ${options.model}`);
  return {
    generateContent: async (prompt: string) => {
      console.log("\n=== 1. EXACT PROMPT SENT TO GEMINI ===");
      console.log(prompt.trim());
      console.log("======================================\n");
      
      const mockResponse = {
        communicationScore: 8,
        familyScore: 7,
        careerScore: 9,
        financialScore: 6,
        lifestyleScore: 8,
        emotionalScore: 7,
        traditionalScore: 5,
        parentingScore: 9,
        independenceScore: 8
      };
      
      console.log("=== 2. RAW JSON RESPONSE FROM GEMINI ===");
      console.log(JSON.stringify(mockResponse, null, 2));
      console.log("========================================\n");

      return {
        response: {
          text: () => JSON.stringify(mockResponse)
        }
      } as any;
    }
  } as any;
};

async function main() {
  console.log("🧪 Starting AI Trait Generation V2 Gemini-Mock Verification...");

  // Set a dummy API key so gemini.ts doesn't bypass Gemini
  process.env.GEMINI_API_KEY = "mock_api_key_for_testing";

  // Dynamic imports to prevent hoisted imports from evaluating before env var is set
  const { prisma } = await import("../src/config/prisma.js");
  const { generateAITraits } = await import("../src/integrations/gemini.js");
  const { TraitService } = await import("../src/modules/match/trait.service.js");

  const traitService = new TraitService();

  // 1. Fetch an approved profile
  const profiles = await prisma.agencyProfile.findMany({
    where: { status: "ACTIVE" },
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

  const profile = profiles.find(p => p.answers.length >= 40);

  if (!profile) {
    console.error("❌ No active profiles with sufficient answers (>= 40) found in database.");
    return;
  }

  console.log(`Found Real Profile: ${profile.profileNumber} (ID: ${profile.id})`);
  console.log("\n=== 3. REAL QUESTIONNAIRE INPUTS ===");
  const formattedAnswers = profile.answers.map(ans => {
    let qText = ans.question?.questionText || "";
    try {
      const parsed = JSON.parse(qText);
      qText = parsed.text || qText;
    } catch {}
    return {
      question: qText,
      answer: ans.selectedOption?.optionText || ""
    };
  });
  console.log(JSON.stringify(formattedAnswers, null, 2));
  console.log("=====================================\n");

  // 2. Call generateAITraits
  console.log("=== 4. RUNNING generateAITraits() ===");
  const aiTraits = await generateAITraits(profile);
  console.log("Output of generateAITraits():", JSON.stringify(aiTraits, null, 2));
  console.log("=====================================\n");

  // 3. Verify all 9 trait fields are populated with integers 1-10
  console.log("=== 5. VERIFYING ALL 9 TRAIT FIELDS ARE INTEGERS 1-10 ===");
  const traitFields = [
    "communicationScore", "familyScore", "careerScore", "financialScore",
    "lifestyleScore", "emotionalScore", "traditionalScore", "parentingScore", "independenceScore"
  ];

  for (const field of traitFields) {
    const value = (aiTraits as any)[field];
    if (typeof value !== "number" || isNaN(value) || value < 1 || value > 10 || !Number.isInteger(value)) {
      throw new Error(`❌ FAIL: Field '${field}' has invalid value: ${value}. Expected integer between 1 and 10.`);
    }
    console.log(`✅ Field '${field}' is valid: ${value}`);
  }
  console.log("========================================================\n");

  // 4. Test storing/upserting to DB
  console.log("=== 6. STORING GENERATED TRAITS IN DB ===");
  const storedTraits = await traitService.generateAndStoreTraits(profile.id, profile, false);
  console.log("Upserted DB Record:", JSON.stringify(storedTraits, null, 2));
  console.log("==========================================\n");

  // 5. Clean up DB changes if needed, or check existence
  const dbRecord = await prisma.userTrait.findUnique({
    where: { profileId: profile.id }
  });
  if (!dbRecord) {
    throw new Error("❌ FAIL: No database record found after storage.");
  }
  console.log("🎉 ALL GEMINI-MOCKED TRAITS VERIFICATIONS PASSED SUCCESSFULLY!");
}

main()
  .catch(console.error);
