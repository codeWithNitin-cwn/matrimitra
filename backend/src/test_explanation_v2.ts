import { generateAIExplanation } from "./integrations/gemini.js";

async function test() {
  console.log("==================================================");
  console.log("🧪 RUNNING AI MATCH EXPLANATION V2 TEST SUITE");
  console.log("==================================================\n");

  const target = {
    person: { firstName: "Karthik", gender: "MALE", dob: new Date("1995-05-15") },
    educations: [{ qualification: "B.Tech in Computer Science" }],
    careers: [{ profession: "Software Engineer" }],
    personal: { city: "Hyderabad" },
    answers: [
      {
        questionId: "q1",
        question: { questionText: "How do you handle disagreements?" },
        selectedOption: { optionText: "Discuss immediately" }
      },
      {
        questionId: "q2",
        question: { questionText: "Preferred family setup after marriage" },
        selectedOption: { optionText: "Joint family" }
      },
      {
        questionId: "q3",
        question: { questionText: "What is your timeline for planning children?" },
        selectedOption: { optionText: "1-2 years" }
      },
      {
        questionId: "q4",
        question: { questionText: "What preferred lifestyle do you focus on?" },
        selectedOption: { optionText: "Balanced lifestyle" }
      }
    ]
  };

  const candidate = {
    person: { firstName: "Anjali", gender: "FEMALE", dob: new Date("1997-08-20") },
    educations: [{ qualification: "MBA in Finance" }],
    careers: [{ profession: "Financial Analyst" }],
    personal: { city: "Hyderabad" },
    answers: [
      {
        questionId: "q1",
        question: { questionText: "How do you handle disagreements?" },
        selectedOption: { optionText: "Discuss immediately" }
      },
      {
        questionId: "q2",
        question: { questionText: "Preferred family setup after marriage" },
        selectedOption: { optionText: "Joint family" }
      },
      {
        questionId: "q3",
        question: { questionText: "What is your timeline for planning children?" },
        selectedOption: { optionText: "1-2 years" }
      },
      {
        questionId: "q4",
        question: { questionText: "What preferred lifestyle do you focus on?" },
        selectedOption: { optionText: "Balanced lifestyle" }
      }
    ]
  };

  const score = 92;
  const confidenceScore = 95;

  // Case 1: High Confidence fallback V2
  console.log("1. TEST CASE: High Confidence V2 Fallback Output (No API key)");
  const v2Fallback = await generateAIExplanation(
    target,
    candidate,
    {}, // traits (unused by fallback)
    {},
    score,
    confidenceScore,
    [], // strengths (unused by fallback)
    []  // concerns (unused by fallback)
  );
  console.log(v2Fallback);
  console.log("\n==================================================");

  // Case 2: Low Confidence fallback V2
  console.log("2. TEST CASE: Low Confidence V2 Fallback (< 50)");
  const v2FallbackLow = await generateAIExplanation(
    target,
    candidate,
    {},
    {},
    score,
    45, // low confidence
    [],
    []
  );
  console.log(v2FallbackLow);
  console.log("\n==================================================");
}

test().catch(console.error);
