import { prisma } from "../../backend/src/config/prisma";

const rawQuestions = [
  // Category 1: Relationship & Communication (RELATIONSHIP)
  {
    text: "How do you usually handle disagreements?",
    category: "Relationship & Communication",
    dbCategory: "RELATIONSHIP",
    type: "SINGLE_CHOICE",
    options: ["Discuss immediately", "Take time and discuss later", "Prefer mediation", "Avoid confrontation"]
  },
  {
    text: "How important is daily communication with your partner?",
    category: "Relationship & Communication",
    dbCategory: "RELATIONSHIP",
    type: "SINGLE_CHOICE",
    options: ["Extremely important", "Important", "Moderate", "Not important"]
  },
  {
    text: "When stressed, what support do you expect from your partner?",
    category: "Relationship & Communication",
    dbCategory: "RELATIONSHIP",
    type: "SINGLE_CHOICE",
    options: ["Emotional support", "Practical solutions", "Space and independence", "Depends on situation"]
  },
  {
    text: "Which quality matters most in a spouse?",
    category: "Relationship & Communication",
    dbCategory: "RELATIONSHIP",
    type: "SINGLE_CHOICE",
    options: ["Trust", "Loyalty", "Respect", "Communication", "Emotional understanding"]
  },

  // Category 2: Marriage Expectations (RELATIONSHIP)
  {
    text: "Why do you want to get married?",
    category: "Marriage Expectations",
    dbCategory: "RELATIONSHIP",
    type: "SINGLE_CHOICE",
    options: ["Companionship", "Family building", "Emotional connection", "Social/cultural reasons", "Shared life goals"]
  },
  {
    text: "What does a successful marriage mean to you?",
    category: "Marriage Expectations",
    dbCategory: "RELATIONSHIP",
    type: "LONG_TEXT",
    options: []
  },
  {
    text: "What is your biggest expectation from marriage?",
    category: "Marriage Expectations",
    dbCategory: "RELATIONSHIP",
    type: "LONG_TEXT",
    options: []
  },

  // Category 3: Family Compatibility (FAMILY_VALUES)
  {
    text: "Preferred family setup after marriage?",
    category: "Family Compatibility",
    dbCategory: "FAMILY_VALUES",
    type: "SINGLE_CHOICE",
    options: ["Joint family", "Nuclear family", "Either"]
  },
  {
    text: "How involved should parents be in major decisions?",
    category: "Family Compatibility",
    dbCategory: "FAMILY_VALUES",
    type: "SINGLE_CHOICE",
    options: ["Highly involved", "Moderately involved", "Minimal involvement"]
  },
  {
    text: "Family or career during major conflicts?",
    category: "Family Compatibility",
    dbCategory: "FAMILY_VALUES",
    type: "SINGLE_CHOICE",
    options: ["Family first", "Career first", "Balance both"]
  },
  {
    text: "How important are traditions and customs?",
    category: "Family Compatibility",
    dbCategory: "FAMILY_VALUES",
    type: "SINGLE_CHOICE",
    options: ["Very important", "Important", "Neutral", "Not important"]
  },

  // Category 4: Children Compatibility (FAMILY_VALUES)
  {
    text: "Do you want children?",
    category: "Children Compatibility",
    dbCategory: "FAMILY_VALUES",
    type: "SINGLE_CHOICE",
    options: ["Yes", "No", "Undecided"]
  },
  {
    text: "Preferred timeline for children?",
    category: "Children Compatibility",
    dbCategory: "FAMILY_VALUES",
    type: "SINGLE_CHOICE",
    options: ["Immediately", "1-2 years", "3-5 years", "Later"]
  },
  {
    text: "Parenting style preference?",
    category: "Children Compatibility",
    dbCategory: "FAMILY_VALUES",
    type: "SINGLE_CHOICE",
    options: ["Strict", "Balanced", "Liberal"]
  },
  {
    text: "Who should take primary parenting responsibility?",
    category: "Children Compatibility",
    dbCategory: "FAMILY_VALUES",
    type: "SINGLE_CHOICE",
    options: ["Both equally", "Mostly mother", "Mostly father", "Situation dependent"]
  },

  // Category 5: Career Compatibility (LIFESTYLE)
  {
    text: "Should both partners work after marriage?",
    category: "Career Compatibility",
    dbCategory: "LIFESTYLE",
    type: "SINGLE_CHOICE",
    options: ["Yes", "No", "Depends"]
  },
  {
    text: "Would you relocate for your spouse's career?",
    category: "Career Compatibility",
    dbCategory: "LIFESTYLE",
    type: "SINGLE_CHOICE",
    options: ["Yes", "No", "Depends"]
  },
  {
    text: "How important is career growth?",
    category: "Career Compatibility",
    dbCategory: "LIFESTYLE",
    type: "SINGLE_CHOICE",
    options: ["Extremely important", "Important", "Moderate", "Not important"]
  },
  {
    text: "Preferred lifestyle?",
    category: "Career Compatibility",
    dbCategory: "LIFESTYLE",
    type: "SINGLE_CHOICE",
    options: ["Career focused", "Family focused", "Balanced"]
  },

  // Category 6: Financial Compatibility (LIFESTYLE)
  {
    text: "Spending style?",
    category: "Financial Compatibility",
    dbCategory: "LIFESTYLE",
    type: "SINGLE_CHOICE",
    options: ["Saver", "Balanced", "Spender"]
  },
  {
    text: "Should finances be managed jointly?",
    category: "Financial Compatibility",
    dbCategory: "LIFESTYLE",
    type: "SINGLE_CHOICE",
    options: ["Yes", "No", "Partially"]
  },
  {
    text: "How important is financial planning?",
    category: "Financial Compatibility",
    dbCategory: "LIFESTYLE",
    type: "SINGLE_CHOICE",
    options: ["Very important", "Important", "Moderate", "Not important"]
  },
  {
    text: "What is your financial goal?",
    category: "Financial Compatibility",
    dbCategory: "LIFESTYLE",
    type: "SINGLE_CHOICE",
    options: ["Wealth creation", "Comfortable life", "Early retirement", "Business growth"]
  },

  // Category 7: Lifestyle Compatibility (LIFESTYLE)
  {
    text: "Food preference?",
    category: "Lifestyle Compatibility",
    dbCategory: "LIFESTYLE",
    type: "SINGLE_CHOICE",
    options: ["Vegetarian", "Eggetarian", "Non-vegetarian", "Vegan", "Jain"]
  },
  {
    text: "Smoking habit?",
    category: "Lifestyle Compatibility",
    dbCategory: "LIFESTYLE",
    type: "SINGLE_CHOICE",
    options: ["Never", "Occasionally", "Regularly"]
  },
  {
    text: "Drinking habit?",
    category: "Lifestyle Compatibility",
    dbCategory: "LIFESTYLE",
    type: "SINGLE_CHOICE",
    options: ["Never", "Socially", "Occasionally", "Regularly"]
  },
  {
    text: "Weekend preference?",
    category: "Lifestyle Compatibility",
    dbCategory: "LIFESTYLE",
    type: "SINGLE_CHOICE",
    options: ["Home", "Family", "Travel", "Social gatherings"]
  },
  {
    text: "Fitness importance?",
    category: "Lifestyle Compatibility",
    dbCategory: "LIFESTYLE",
    type: "SINGLE_CHOICE",
    options: ["Very important", "Important", "Moderate", "Not important"]
  },

  // Category 8: Personality Compatibility (PERSONALITY)
  {
    text: "Which describes you best?",
    category: "Personality Compatibility",
    dbCategory: "PERSONALITY",
    type: "SINGLE_CHOICE",
    options: ["Introvert", "Extrovert", "Ambivert"]
  },
  {
    text: "How do you make important decisions?",
    category: "Personality Compatibility",
    dbCategory: "PERSONALITY",
    type: "SINGLE_CHOICE",
    options: ["Logic", "Emotions", "Both"]
  },
  {
    text: "How adventurous are you?",
    category: "Personality Compatibility",
    dbCategory: "PERSONALITY",
    type: "SINGLE_CHOICE",
    options: ["Very adventurous", "Moderately adventurous", "Conservative"]
  },
  {
    text: "How important is personal space?",
    category: "Personality Compatibility",
    dbCategory: "PERSONALITY",
    type: "SINGLE_CHOICE",
    options: ["Very important", "Important", "Moderate", "Not important"]
  },

  // Category 9: Future Goals Compatibility (FUN)
  {
    text: "Where would you like to settle?",
    category: "Future Goals Compatibility",
    dbCategory: "FUN",
    type: "SINGLE_CHOICE",
    options: ["Current city", "Metro city", "Abroad", "Flexible"]
  },
  {
    text: "What are your top 3 life goals?",
    category: "Future Goals Compatibility",
    dbCategory: "FUN",
    type: "LONG_TEXT",
    options: []
  },
  {
    text: "Describe your dream life after 10 years.",
    category: "Future Goals Compatibility",
    dbCategory: "FUN",
    type: "LONG_TEXT",
    options: []
  },
  {
    text: "What kind of future family do you envision?",
    category: "Future Goals Compatibility",
    dbCategory: "FUN",
    type: "LONG_TEXT",
    options: []
  },

  // Category 10: AI Gold Questions (FUN)
  {
    text: "What values can never be compromised in your life?",
    category: "AI Gold Questions",
    dbCategory: "FUN",
    type: "LONG_TEXT",
    options: []
  },
  {
    text: "Describe your ideal life partner.",
    category: "AI Gold Questions",
    dbCategory: "FUN",
    type: "LONG_TEXT",
    options: []
  },
  {
    text: "What lessons have past relationships taught you?",
    category: "AI Gold Questions",
    dbCategory: "FUN",
    type: "LONG_TEXT",
    options: []
  },
  {
    text: "How do you define love?",
    category: "AI Gold Questions",
    dbCategory: "FUN",
    type: "LONG_TEXT",
    options: []
  },
  {
    text: "What kind of support do you expect from your spouse?",
    category: "AI Gold Questions",
    dbCategory: "FUN",
    type: "LONG_TEXT",
    options: []
  },
  {
    text: "What kind of spouse do you want to become?",
    category: "AI Gold Questions",
    dbCategory: "FUN",
    type: "LONG_TEXT",
    options: []
  },
  {
    text: "What would make you feel deeply understood in a marriage?",
    category: "AI Gold Questions",
    dbCategory: "FUN",
    type: "LONG_TEXT",
    options: []
  },
  {
    text: "If your future partner reads this answer, what would you want them to know about you?",
    category: "AI Gold Questions",
    dbCategory: "FUN",
    type: "LONG_TEXT",
    options: []
  }
];

async function main() {
  console.log("🌱 Starting safe question-only seeding...");
  let skipCount = 0;
  let insertCount = 0;

  for (const q of rawQuestions) {
    const encodedText = JSON.stringify({
      text: q.text,
      category: q.category,
      type: q.type
    });

    const existingQuestion = await prisma.question.findFirst({
      where: { questionText: encodedText }
    });

    if (existingQuestion) {
      skipCount++;
      continue;
    }

    const createdQuestion = await prisma.question.create({
      data: {
        questionText: encodedText,
        category: q.dbCategory as any,
        isActive: true,
      }
    });

    if (q.type === "SINGLE_CHOICE" && q.options.length > 0) {
      for (const opt of q.options) {
        await prisma.questionOption.create({
          data: {
            questionId: createdQuestion.id,
            optionText: opt
          }
        });
      }
    } else {
      await prisma.questionOption.create({
        data: {
          questionId: createdQuestion.id,
          optionText: "TEXT_ANSWER"
        }
      });
    }
    insertCount++;
  }

  console.log(`✅ Safe question seeding complete!`);
  console.log(`   Created: ${insertCount}`);
  console.log(`   Skipped: ${skipCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
