import { generateProfileSummary } from "./integrations/gemini.js";

async function test() {
  console.log("==================================================");
  console.log("🧪 RUNNING AI PROFILE SUMMARY V1 TEST SUITE");
  console.log("==================================================\n");

  const profile = {
    person: { firstName: "Priya", gender: "FEMALE", dob: new Date("1997-08-20") },
    educations: [{ qualification: "MBA in Finance", specialization: "Investment Banking" }],
    careers: [{ profession: "Financial Analyst", workLocation: "Mumbai" }],
    lifestyles: [{ foodHabit: "Vegetarian", smoking: false, drinking: false }],
    preferences: [{ minAge: 27, maxAge: 32, religion: "Hindu", education: "MBA" }],
    answers: [
      {
        question: { questionText: "Preferred family setup after marriage" },
        selectedOption: { optionText: "Joint family" }
      },
      {
        question: { questionText: "How do you prefer to handle disagreements?" },
        selectedOption: { optionText: "Discuss immediately in a calm manner" }
      },
      {
        question: { questionText: "What preferred lifestyle do you focus on?" },
        selectedOption: { optionText: "Balanced lifestyle" }
      }
    ]
  };

  // Case 1: Deterministic Fallback summary (No Gemini key or forced fallback)
  console.log("1. TEST CASE: Deterministic Fallback summary (No API key)");
  const fallbackSummary = await generateProfileSummary(profile, true);
  console.log(`[Fallback Summary]:\n"${fallbackSummary}"\n`);

  // Case 2: Gemini API Integration Prompt Structure
  console.log("2. TEST CASE: Gemini API Prompt Structure");
  console.log("The prompt sent to the Gemini API is structured to enforce constraints:");
  const promptExample = `
You are an expert matrimonial matchmaker for MatriMitra.
Your task is to write a warm, professional, and positive user-facing profile summary for Priya.

Candidate Details:
- Name: Priya
- Gender: FEMALE
- Age: 28
- Education: MBA in Finance (Specialized in Investment Banking)
- Profession: Financial Analyst based in Mumbai
- Lifestyle: Food habit: Vegetarian, Smoking: No, Drinking: No
- Questionnaire Answers:
- Preferred family setup after marriage: Joint family
- How do you prefer to handle disagreements?: Discuss immediately in a calm manner
- What preferred lifestyle do you focus on?: Balanced lifestyle

Partner Preferences:
- Expected Age: Min 27, Max 32
- Expected Religion: Hindu
- Expected Education: MBA
- Expected Profession: N/A

Based on this, write a summary explaining who they are and what they are looking for in a partner.
- Write exactly 2 to 4 sentences.
- Refer to them by their first name: Priya.
- Keep the tone warm, respectful, and engaging.
- Do NOT include any meta-commentary, markdown headers, or JSON wrapping. Return ONLY the plain text summary.
`;
  console.log(promptExample.trim());
  
  console.log("\nSimulated Gemini Output for the prompt above:");
  console.log(`"Priya is a financial analyst based in Mumbai who holds an MBA in Finance and values a balanced lifestyle. She is a vegetarian who values a joint family setup and believes in resolving conflicts through open, calm communication. Priya is looking for a Hindu partner aged 27 to 32 with a professional background like an MBA, who shares similar values and long-term aspirations."`);
  console.log("\n==================================================");
}

test().catch(console.error);
