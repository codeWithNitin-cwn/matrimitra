import { generateAIExplanation } from "./integrations/gemini.js";

async function test() {
  console.log("==================================================");
  console.log("🧪 RUNNING AI MATCH EXPLANATION V1 TEST SUITE");
  console.log("==================================================\n");

  const target = {
    person: { firstName: "Rahul", gender: "MALE", dob: new Date("1995-05-15") },
    educations: [{ qualification: "B.Tech in Computer Science" }],
    careers: [{ profession: "Software Engineer" }],
    personal: { city: "Hyderabad" }
  };

  const candidate = {
    person: { firstName: "Priya", gender: "FEMALE", dob: new Date("1997-08-20") },
    educations: [{ qualification: "MBA in Finance" }],
    careers: [{ profession: "Financial Analyst" }],
    personal: { city: "Hyderabad" }
  };

  const targetTraits = {
    communicationScore: 8,
    familyScore: 8,
    careerScore: 7,
    financialScore: 7,
    lifestyleScore: 8,
    emotionalScore: 8,
    traditionalScore: 6,
    parentingScore: 8,
    independenceScore: 7
  };

  const candidateTraits = {
    communicationScore: 8,
    familyScore: 8,
    careerScore: 8,
    financialScore: 7,
    lifestyleScore: 7,
    emotionalScore: 8,
    traditionalScore: 5,
    parentingScore: 8,
    independenceScore: 8
  };

  const score = 88;
  const strengths = ["Strong communication compatibility", "Similar family expectations", "Similar financial habits", "Similar parenting expectations"];
  const concerns = ["Slight difference in career priorities", "Slight difference in traditional values"];

  // 1. Test Confidence awareness (< 50)
  console.log("1. TEST CASE: Confidence Score < 50 (Low questionnaire data)");
  const explanationLowConfidence = await generateAIExplanation(
    target,
    candidate,
    targetTraits,
    candidateTraits,
    score,
    45, // confidence score
    strengths,
    concerns
  );
  console.log(`[Result]: "${explanationLowConfidence}"\n`);

  // 2. Test Fallback Path (No API key)
  console.log("2. TEST CASE: Fallback Path (No API key, Confidence >= 50)");
  // Ensure GEMINI_API_KEY is not set for this test
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const explanationFallback = await generateAIExplanation(
    target,
    candidate,
    targetTraits,
    candidateTraits,
    score,
    90, // confidence score
    strengths,
    concerns
  );
  console.log(`[Result]: "${explanationFallback}"\n`);

  // Restore env if it was set
  if (originalKey) {
    process.env.GEMINI_API_KEY = originalKey;
  }

  // 3. Test Gemini Integration Prompt Structure & Mock Output
  console.log("3. TEST CASE: Gemini Prompt Structure");
  console.log("The prompt sent to the Gemini API is structured to enforce constraints:");
  const promptExample = `
You are an expert matrimonial matchmaker and relationship counselor for MatriMitra.
Your task is to analyze two profiles (Bride and Groom) and generate a natural, warm, and professional 1-2 paragraph matchmaking explanation.

Target Profile (User):
- Name: Rahul
- Gender: MALE
- Age: 31
- Education: B.Tech in Computer Science
- Profession: Software Engineer
- City: Hyderabad

Candidate Profile:
- Name: Priya
- Gender: FEMALE
- Age: 28
- Education: MBA in Finance
- Profession: Financial Analyst
- City: Hyderabad

Matching Data:
- Compatibility Score: 88%
- Strengths: ["Strong communication compatibility","Similar family expectations","Similar financial habits","Similar parenting expectations"]
- Concerns: ["Slight difference in career priorities","Slight difference in traditional values"]
- Traits Alignment: Target traits {"communicationScore":8,"familyScore":8,"careerScore":7,"financialScore":7,"lifestyleScore":8,"emotionalScore":8,"traditionalScore":6,"parentingScore":8,"independenceScore":7} compared to Candidate traits {"communicationScore":8,"familyScore":8,"careerScore":8,"financialScore":7,"lifestyleScore":7,"emotionalScore":8,"traditionalScore":5,"parentingScore":8,"independenceScore":8}

Based on this information, write a user-facing narrative explaining their compatibility.
- Write exactly 1 to 2 paragraphs.
- Keep the tone warm, positive, yet professional.
- Refer to them by their first names: Rahul and Priya.
- Highlight key strengths (areas where they align) and gently mention any differences/concerns as areas for future discussion.
- Output ONLY the plain text of your explanation. Do NOT include JSON formatting, Markdown headers, code block delimiters, or extra text.
`;
  console.log(promptExample.trim());
  
  console.log("\nSimulated Gemini Output for the prompt above:");
  console.log(`"Rahul and Priya are highly compatible with a score of 88%, showing strong alignment in key aspects of their lives. They both value open, healthy communication and share very similar expectations around family dynamics and parenting, which provides a solid foundation for their future together. Furthermore, their mutual saving and spending habits indicate a shared perspective on financial planning. 
  
While their connection is very strong, they may want to explore minor differences, such as their career priorities and how they balance traditional values, to ensure complete alignment as they move forward."`);
  console.log("\n==================================================");
}

test().catch(console.error);
