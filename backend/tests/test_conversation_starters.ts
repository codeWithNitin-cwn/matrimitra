import { generateConversationStarters } from "../src/integrations/gemini.js";

async function testConversationStarters() {
  console.log("==================================================");
  console.log("🧪 RUNNING AI CONVERSATION STARTERS TEST SUITE");
  console.log("==================================================\n");

  const target = {
    answers: [
      {
        questionId: "q1",
        question: { questionText: "How do you usually handle disagreements?" },
        selectedOption: { optionText: "Discuss immediately" }
      },
      {
        questionId: "q2",
        question: { questionText: "Preferred family setup after marriage?" },
        selectedOption: { optionText: "Joint family" }
      },
      {
        questionId: "q3",
        question: { questionText: "Preferred timeline for children?" },
        selectedOption: { optionText: "1-2 years" }
      }
    ]
  };

  const candidate = {
    answers: [
      {
        questionId: "q1",
        question: { questionText: "How do you usually handle disagreements?" },
        selectedOption: { optionText: "Discuss immediately" }
      },
      {
        questionId: "q2",
        question: { questionText: "Preferred family setup after marriage?" },
        selectedOption: { optionText: "Joint family" }
      },
      {
        questionId: "q3",
        question: { questionText: "Preferred timeline for children?" },
        selectedOption: { optionText: "1-2 years" }
      }
    ]
  };

  console.log("1. Generating starters for high alignment (all matches):");
  const startersHigh = await generateConversationStarters(target, candidate, [], []);
  console.log(startersHigh);
  if (startersHigh.length === 3) {
    console.log("✅ Returned exactly 3 conversation starters.");
  } else {
    console.log(`❌ Returned ${startersHigh.length} instead of 3.`);
  }

  // Mismatched scenario (should trigger fallbacks)
  const targetMismatch = {
    answers: [
      {
        questionId: "q1",
        question: { questionText: "How do you usually handle disagreements?" },
        selectedOption: { optionText: "Discuss immediately" }
      }
    ]
  };
  const candidateMismatch = {
    answers: [
      {
        questionId: "q1",
        question: { questionText: "How do you usually handle disagreements?" },
        selectedOption: { optionText: "Avoid confrontation" } // mismatch
      }
    ]
  };

  console.log("\n2. Generating starters for low alignment (no matches, should trigger fallback defaults):");
  const startersLow = await generateConversationStarters(targetMismatch, candidateMismatch, [], []);
  console.log(startersLow);
  if (startersLow.length === 3) {
    console.log("✅ Returned exactly 3 conversation starters.");
  } else {
    console.log(`❌ Returned ${startersLow.length} instead of 3.`);
  }
}

testConversationStarters().catch(console.error);
