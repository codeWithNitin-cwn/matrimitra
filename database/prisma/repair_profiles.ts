import { prisma } from "../../backend/src/config/prisma.js";

const profileAnswersData = {
  Priya: {
    "successful marriage": "A successful marriage is built on mutual respect, intellectual compatibility, and equal partnership where both support each other's dreams.",
    "biggest expectation": "Open communication and emotional security.",
    "top 3 life goals": "Achieve professional excellence in Tech, travel to at least 20 countries, and maintain a balanced, healthy family life.",
    "dream life after 10 years": "Leading a team in a tech company, having a peaceful home with kids, and practicing classical music regularly.",
    "future family": "A happy, supportive environment where values of education, kindness, and independent thinking are nurtured.",
    "never be compromised": "Integrity, self-respect, and vegetarian lifestyle values.",
    "ideal life partner": "A progressive Brahmin professional with a strong educational background, who values equality and shares a love for travel.",
    "past relationships": "Patience and the importance of active listening are key to resolving conflicts.",
    "define love": "Love is a steady partnership of growth, safety, comfort, and friendship.",
    "support do you expect": "Understanding during stressful work cycles and active participation in household responsibilities.",
    "spouse do you want to become": "A supportive, empathetic, and encouraging partner who stands strong during testing times.",
    "deeply understood": "When my partner notices minor changes in my mood and gives me space when needed.",
    "want them to know": "I am deeply passionate about my work, love playing sitar, and value close family connections."
  },
  Nikhila: {
    "successful marriage": "A successful marriage is a commitment of two families to stay united while the partners share common ethical and spiritual values.",
    "biggest expectation": "Shared values, respect for elders, and a stable financial mindset.",
    "top 3 life goals": "Achieve financial independence, establish a cultural institute for dance/music, and raise kids with strong traditional values.",
    "dream life after 10 years": "Working in senior leadership, managing a peaceful household, and teaching children traditional shlokas and music.",
    "future family": "A household grounded in values of respect, honesty, cultural traditions, and intellectual curiosity.",
    "never be compromised": "Religious boundaries, family respect, and absolute honesty.",
    "ideal life partner": "A well-settled Kannada Brahmin professional who values traditions, has a logical mindset, and respects parents.",
    "past relationships": "Communication gaps are the main reasons for misunderstandings; early clarification is always better.",
    "define love": "Love is deep commitment, trust, and growing old together while respecting each other's individuality.",
    "support do you expect": "Providing emotional stability during challenging financial cycles and valuing my relationship with my parents.",
    "spouse do you want to become": "An understanding, caring, and grounded partner who builds a warm and peaceful home environment.",
    "deeply understood": "When my silence is understood and my professional ambitions are supported without insecurity.",
    "want them to know": "I am deeply spiritual, practice meditation daily, and balance my modern career with traditional roots."
  },
  Arjun: {
    "successful marriage": "A successful marriage requires logical alignment, clear division of responsibilities, and compatibility in spending habits.",
    "biggest expectation": "A partner who has a clear view of life, keeps family close, and maintains a positive vibe.",
    "top 3 life goals": "Achieve director position in corporate strategy, build my own home in Jaipur, and ensure quality education for future children.",
    "dream life after 10 years": "Living a comfortable life, managing private investments, and taking family on annual holidays.",
    "future family": "A balanced family where learning is valued, respect is mutual, and relatives are always welcome.",
    "never be compromised": "Integrity, financial responsibility, and family values.",
    "ideal life partner": "An educated Brahmin girl, preferably working, who has a positive outlook and is willing to settle in Ahmedabad/Gujarat.",
    "past relationships": "It's best to discuss expectations clearly before making long-term commitments.",
    "define love": "Love is consistent support, practical care, and build a secure life together.",
    "support do you expect": "Allowing me the focus during hectic business expansions and helping keep family bonds warm.",
    "spouse do you want to become": "A reliable, rational, and financially secure partner who is always available for support.",
    "deeply understood": "When my partner appreciates the silent efforts I put into securing our financial future.",
    "want them to know": "I am a sports lover, read a lot of history, and am very dedicated to my parents."
  },
  Rohit: {
    "successful marriage": "A successful marriage is when both partners inspire each other to grow intellectually and share a safe space of comfort and fun.",
    "biggest expectation": "Shared passion for life, continuous learning, and travel.",
    "top 3 life goals": "Lead a research division in AI, travel to all continents, and fund educational heritage trusts.",
    "dream life after 10 years": "Working in tech leadership, playing violin on stages, and having a warm home filled with music and books.",
    "future family": "A progressive home where education, travel, arts, and kindness are valued above material success.",
    "never be compromised": "Mutual trust, self-respect, and keeping promises.",
    "ideal life partner": "A highly qualified Tamil/South Indian Brahmin girl who is progressive, loves travel/arts, and wants to build a career.",
    "past relationships": "Honesty in the beginning prevents complex disputes later.",
    "define love": "Love is quiet comfort, trust, shared curiosity, and deep intellectual connection.",
    "support do you expect": "Validating my creative pursuits (music) and encouraging me to take calculated strategic risks.",
    "spouse do you want to become": "An open-minded, supporting, and cheerful partner who is a great listener.",
    "deeply understood": "When my partner encourages me to play the violin after a long day and shares my interest in astronomy.",
    "want them to know": "I am deeply passionate about Carnatic classical violin, love star-gazing, and have lived in the US for 6 years before moving to Chennai."
  }
};

async function repair() {
  console.log("Starting matrimonial profiles questionnaire repair...");

  // Fetch all questions and options
  const dbQuestions = await prisma.question.findMany({
    include: { options: true }
  });

  const profiles = await prisma.agencyProfile.findMany({
    include: {
      person: true,
      answers: {
        include: {
          selectedOption: true
        }
      }
    }
  });

  let repairedCount = 0;

  for (const profile of profiles) {
    const firstName = profile.person.firstName;
    const answersMap = (profileAnswersData as any)[firstName];
    if (!answersMap) {
      console.log(`Skipping profile: ${firstName} ${profile.person.lastName} (No repair data)`);
      continue;
    }

    console.log(`Repairing profile: ${firstName} ${profile.person.lastName}...`);
    let profileRepaired = false;

    for (const [key, textVal] of Object.entries(answersMap)) {
      // Find matching question
      const targetQ = dbQuestions.find(dbq => {
        try {
          const parsed = JSON.parse(dbq.questionText);
          return parsed.text.toLowerCase().includes(key.toLowerCase());
        } catch {
          return dbq.questionText.toLowerCase().includes(key.toLowerCase());
        }
      });

      if (!targetQ) continue;

      // Ensure it is a LONG_TEXT question (has "TEXT_ANSWER" option or parsed type is LONG_TEXT)
      let isLongText = false;
      try {
        const parsed = JSON.parse(targetQ.questionText);
        isLongText = parsed.type === "LONG_TEXT";
      } catch {
        isLongText = targetQ.options.some(o => o.optionText === "TEXT_ANSWER");
      }

      if (!isLongText) continue;

      // Find or create the option with the actual text answer
      let option = targetQ.options.find(o => o.optionText === textVal);
      if (!option) {
        option = await prisma.questionOption.create({
          data: {
            questionId: targetQ.id,
            optionText: textVal as string
          }
        });
        targetQ.options.push(option);
      }

      // Upsert/Update the profile answer
      const existingAnswer = profile.answers.find(a => a.questionId === targetQ.id);
      if (existingAnswer) {
        if (existingAnswer.selectedOption.optionText === "TEXT_ANSWER") {
          await prisma.profileAnswer.update({
            where: { id: existingAnswer.id },
            data: { selectedOptionId: option.id }
          });
          profileRepaired = true;
        }
      } else {
        await prisma.profileAnswer.create({
          data: {
            profileId: profile.id,
            questionId: targetQ.id,
            selectedOptionId: option.id,
            importance: "MUST_HAVE"
          }
        });
        profileRepaired = true;
      }
    }

    if (profileRepaired) {
      repairedCount++;
      console.log(`Repaired profile successfully: ${firstName} ${profile.person.lastName}`);
    } else {
      console.log(`Profile already fully repaired: ${firstName} ${profile.person.lastName}`);
    }
  }

  console.log(`Repaired ${repairedCount} profiles.`);

  // 5. Verification Phase
  console.log("Verifying repaired answers...");
  const badAnswers = await prisma.profileAnswer.findMany({
    where: {
      selectedOption: {
        optionText: {
          in: ["TEXT_ANSWER", ""]
        }
      }
    },
    include: {
      profile: {
        include: { person: true }
      },
      question: true,
      selectedOption: true
    }
  });

  const longTextBadAnswers = badAnswers.filter(a => {
    try {
      const parsed = JSON.parse(a.question.questionText);
      return parsed.type === "LONG_TEXT";
    } catch {
      return a.selectedOption.optionText === "TEXT_ANSWER";
    }
  });

  if (longTextBadAnswers.length > 0) {
    console.error("Verification FAILED! The following answers still contain placeholders:");
    for (const ba of longTextBadAnswers) {
      console.error(`- Profile: ${ba.profile.person.firstName} ${ba.profile.person.lastName}, Question ID: ${ba.questionId}, Answer Value: "${ba.selectedOption.optionText}"`);
    }
    throw new Error("Verification failed: placeholders found.");
  }

  console.log("Verification PASSED: No placeholders found for LONG_TEXT questions.");
}

repair()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
