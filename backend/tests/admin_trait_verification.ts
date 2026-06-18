import { prisma } from "../src/config/prisma.js";
import { TraitService } from "../src/modules/match/trait.service.js";
import { generateAITraits } from "../src/integrations/gemini.js";
import * as readline from "readline";
import * as fs from "fs";
import * as os from "os";
import * as crypto from "crypto";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log("\n=============================================");
  console.log("   🤖 AI Trait Generation V2 - Admin Tool");
  console.log("=============================================\n");

  // 1. Select a profile
  const profileInput = await question("Enter Profile ID or Profile Number to verify: ");
  
  const profile = await prisma.agencyProfile.findFirst({
    where: {
      OR: [
        { id: profileInput },
        { profileNumber: profileInput }
      ]
    },
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
    console.error("❌ Profile not found.");
    rl.close();
    return;
  }

  const currentUser = os.userInfo().username || "Admin";
  console.log(`\n✅ Profile Selected: ${profile.profileNumber} (${profile.person?.firstName || "Unknown"})`);
  
  // 1. Show existing UserTrait row before generation
  const existingTraits = await prisma.userTrait.findUnique({
    where: { profileId: profile.id }
  });
  console.log("\n--- Existing UserTrait in DB ---");
  if (existingTraits) {
    console.log(JSON.stringify(existingTraits, null, 2));
  } else {
    console.log("No existing traits found in database for this profile.");
  }

  // 2. View questionnaire answers
  console.log("\n--- Questionnaire Answers ---");
  if (!profile.answers || profile.answers.length === 0) {
    console.log("No answers found for this profile.");
  } else {
    profile.answers.forEach(ans => {
      let qText = ans.question?.questionText || "Unknown Question";
      try {
        const parsed = JSON.parse(qText);
        qText = parsed.text || qText;
      } catch {}
      console.log(`Q: ${qText}`);
      console.log(`A: ${ans.selectedOption?.optionText || "N/A"}\n`);
    });
  }

  const traitService = new TraitService();

  // 3. Generate Gemini traits manually (and get deterministic ones)
  console.log("⏳ Calculating Deterministic Fallback Traits...");
  const deterministicTraits = traitService.calculateDeterministicTraits(profile.answers);

  console.log("⏳ Calling Gemini API for AI Traits... (Please wait)");
  let rawGeminiTraits: any;
  const startTime = Date.now();
  try {
    rawGeminiTraits = await generateAITraits(profile);
    
  } catch (error) {
    console.error("❌ Failed to generate Gemini traits:", error);
    rl.close();
    return;
  }
  const duration = Date.now() - startTime;

  // 6. Display raw Gemini JSON
  console.log("\n--- Raw Gemini JSON Output ---");
  console.log(JSON.stringify(rawGeminiTraits, null, 2));

  // 3 & 4. Validate all 9 Gemini scores are integers between 1-10, reject if null
  console.log("\n--- Validating Generated Traits ---");
  const keys = [
    "communicationScore", "familyScore", "careerScore", "financialScore", 
    "lifestyleScore", "emotionalScore", "traditionalScore", "parentingScore", "independenceScore"
  ];

  let isValid = true;
  let hasNull = false;

  for (const k of keys) {
    const val = rawGeminiTraits[k];
    if (val === null || val === undefined) {
      hasNull = true;
      isValid = false;
      console.log(`❌ ${k} is null or missing.`);
    } else if (typeof val !== "number" || !Number.isInteger(val) || val < 1 || val > 10) {
      isValid = false;
      console.log(`❌ ${k} has invalid value: ${val} (must be integer 1-10).`);
    } else {
      console.log(`✅ ${k}: ${val}`);
    }
  }

  // 2. Compare deterministic vs Gemini traits side-by-side (with existing delta)
  console.log("\n--- Side-by-Side Comparison (Delta) ---");
  console.table(
    keys.map(k => {
      const existVal = existingTraits ? (existingTraits as any)[k] ?? "null" : "null";
      const detVal = (deterministicTraits as any)[k] ?? "null";
      const gemVal = rawGeminiTraits[k] ?? "null";
      
      let delta: number | string = "N/A";
      if (existingTraits && typeof (existingTraits as any)[k] === 'number' && typeof gemVal === 'number') {
        delta = gemVal - (existingTraits as any)[k];
      }

      return {
        Trait: k,
        "Existing DB": existVal,
        "Deterministic": detVal,
        "Gemini AI V2": gemVal,
        "Delta (Gem - DB)": typeof delta === 'number' && delta > 0 ? `+${delta}` : delta
      };
    })
  );

  // 7. Generate hash and Audit Log
  const geminiHash = crypto.createHash("sha256").update(JSON.stringify(rawGeminiTraits)).digest("hex");
  const validationStatus = isValid && !hasNull ? "PASSED" : "FAILED";
  
  const auditEntry = {
    profileId: profile.id,
    profileNumber: profile.profileNumber,
    timestamp: new Date().toISOString(),
    operator: currentUser,
    existingTraits,
    deterministicTraits,
    geminiTraits: rawGeminiTraits,
    geminiHash,
    validationStatus
  };

  let auditLog: any[] = [];
  if (fs.existsSync("admin_trait_verification_audit.json")) {
    try {
      auditLog = JSON.parse(fs.readFileSync("admin_trait_verification_audit.json", "utf8"));
    } catch (e) {
      console.warn("⚠️  Could not parse existing audit log, starting fresh.");
    }
  }
  auditLog.push(auditEntry);
  fs.writeFileSync("admin_trait_verification_audit.json", JSON.stringify(auditLog, null, 2), "utf8");

  const logLine = `[${auditEntry.timestamp}] User: ${currentUser} | ProfileID: ${profile.id} | Hash: ${geminiHash} | Valid: ${validationStatus}\n`;
  fs.appendFileSync("admin_trait_verification.log", logLine, "utf8");
  console.log(`\n📝 Logged verification run to admin_trait_verification.log and admin_trait_verification_audit.json`);

  if (!isValid || hasNull) {
    console.log("\n❌ Cannot save to Database: Gemini output contains null, missing, or out-of-bounds traits.");
    const action = await question("\n💾 Save as Draft JSON (j) or Skip (s)? [j/s]: ");
    if (action.toLowerCase() === 'j') {
      const draftFileName = `draft_traits_${profile.profileNumber}_${Date.now()}.json`;
      console.log(`⏳ Saving as draft to ${draftFileName}...`);
      fs.writeFileSync(draftFileName, JSON.stringify(rawGeminiTraits, null, 2), "utf8");
      console.log("✅ Successfully saved draft JSON!");
    } else {
      console.log("⏩ Skipped saving.");
    }
  } else {
    if (existingTraits) {
      console.log("\n⚠️  Existing UserTrait record detected.");
      const action = await question("\n💾 Overwrite Existing (o), Save Draft Only (d), or Skip (s)? [o/d/s]: ");
      const choice = action.toLowerCase();
      
      if (choice === 'o') {
        console.log("⏳ Overwriting traits in database...");
        // Expects `traitService.saveTraits()` to be implemented
        const upserted = await (traitService as any).saveTraits(profile.id, rawGeminiTraits);
        console.log("✅ Successfully overwritten traits in database!");
        console.log(JSON.stringify(upserted, null, 2));
      } else if (choice === 'd') {
        const draftFileName = `draft_traits_${profile.profileNumber}_${Date.now()}.json`;
        console.log(`⏳ Saving as draft to ${draftFileName}...`);
        fs.writeFileSync(draftFileName, JSON.stringify(rawGeminiTraits, null, 2), "utf8");
        console.log("✅ Successfully saved draft JSON!");
      } else {
        console.log("⏩ Skipped saving.");
      }
    } else {
      const action = await question("\n💾 Save to Database (d), Save as Draft JSON (j), or Skip (s)? [d/j/s]: ");
      const choice = action.toLowerCase();

      if (choice === 'd') {
        console.log("⏳ Saving traits to database...");
        // Expects `traitService.saveTraits()` to be implemented
        const upserted = await (traitService as any).saveTraits(profile.id, rawGeminiTraits);
        console.log("✅ Successfully saved traits to database!");
        console.log(JSON.stringify(upserted, null, 2));
      } else if (choice === 'j') {
        const draftFileName = `draft_traits_${profile.profileNumber}_${Date.now()}.json`;
        console.log(`⏳ Saving as draft to ${draftFileName}...`);
        fs.writeFileSync(draftFileName, JSON.stringify(rawGeminiTraits, null, 2), "utf8");
        console.log("✅ Successfully saved draft JSON!");
      } else {
        console.log("⏩ Skipped saving.");
      }
    }
  }

  console.log("Exiting...");
  rl.close();
}

main().catch(console.error).finally(() => prisma.$disconnect());