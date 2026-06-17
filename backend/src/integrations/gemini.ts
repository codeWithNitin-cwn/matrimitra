import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

function getCleanQuestionText(rawText: string): string {
  try {
    const parsed = JSON.parse(rawText);
    return parsed.text || rawText;
  } catch {
    return rawText;
  }
}

function getMatchedAnswerSentence(question: string, answer: string): string | null {
  const q = question.toLowerCase();
  const a = answer.toLowerCase().trim();

  // 1. Disagreements
  if (q.includes("disagreement") || q.includes("conflict")) {
    if (a.includes("discuss immediately")) {
      return "Both prefer discussing disagreements immediately, suggesting a direct and open communication style.";
    }
    if (a.includes("discuss later") || a.includes("take time")) {
      return "Both prefer taking time before discussing disagreements, showing a thoughtful and patient communication style.";
    }
    if (a.includes("mediation")) {
      return "Both prefer seeking mediation for disagreements, showing a collaborative conflict-resolution style.";
    }
    if (a.includes("confrontation") || a.includes("avoid")) {
      return "Both prefer avoiding direct confrontation, choosing peaceful approaches to resolve differences.";
    }
  }

  // 2. Family setup
  if (q.includes("family setup")) {
    if (a.includes("joint")) {
      return "Both prefer a joint family environment and value close family relationships.";
    }
    if (a.includes("nuclear")) {
      return "Both prefer a nuclear family setup, valuing personal independence and space.";
    }
    if (a.includes("either")) {
      return "Both are open to either a joint or nuclear family setup, showing flexibility in lifestyle.";
    }
  }

  // 3. Children timeline
  if (q.includes("timeline") && q.includes("children")) {
    if (a.includes("1-2 years")) {
      return "Both share similar expectations regarding family planning and timing for children.";
    }
    if (a.includes("immediately")) {
      return "Both share similar expectations regarding family planning, wishing to have children immediately.";
    }
    if (a.includes("3-5 years")) {
      return "Both agree on a timeline of 3-5 years for starting a family, showing aligned planning.";
    }
    if (a.includes("later")) {
      return "Both agree on starting a family at a later stage, prioritizing other goals currently.";
    }
  }

  // 4. Want children
  if (q.includes("want") && q.includes("children") && !q.includes("timeline")) {
    if (a.includes("yes")) {
      return "Both want to have children in the future, sharing similar family expectations.";
    }
    if (a.includes("no")) {
      return "Both have decided not to have children, sharing aligned expectations.";
    }
    if (a.includes("undecided")) {
      return "Both are currently undecided about having children, keeping their options open.";
    }
  }

  // 5. Partners work
  if (q.includes("partners work") || q.includes("partners should work")) {
    if (a.includes("yes")) {
      return "Both believe that both partners should work after marriage, showing dual-income alignment.";
    }
    if (a.includes("no")) {
      return "Both agree on a single-income household setup after marriage.";
    }
    if (a.includes("depends")) {
      return "Both feel that career choices should depend on circumstances after marriage.";
    }
  }

  // 6. Relocate
  if (q.includes("relocate") || q.includes("relocation")) {
    if (a.includes("yes")) {
      return "Both are willing to relocate for their spouse's career growth, showing strong support.";
    }
    if (a.includes("no")) {
      return "Both prefer to remain in their current location, prioritizing geographic stability.";
    }
    if (a.includes("depends")) {
      return "Both are open to discussing relocation based on career opportunities, showing flexibility.";
    }
  }

  // 7. Career growth
  if (q.includes("career growth")) {
    if (a.includes("extremely") || a.includes("important")) {
      return "Both place high importance on career growth, sharing professional ambition.";
    }
    if (a.includes("moderate") || a.includes("not")) {
      return "Both share a moderate emphasis on career growth, prioritizing overall balance.";
    }
  }

  // 8. Preferred lifestyle
  if (q.includes("lifestyle")) {
    if (a.includes("career")) {
      return "Both prefer a career-focused lifestyle, emphasizing professional growth.";
    }
    if (a.includes("family")) {
      return "Both prefer a family-focused lifestyle, dedicating time to family needs.";
    }
    if (a.includes("balanced")) {
      return "Both prefer a balanced lifestyle, managing career and family commitments.";
    }
  }

  // 9. Spending style
  if (q.includes("spending")) {
    if (a.includes("saver")) {
      return "Both identify as savers, sharing careful and prudent financial habits.";
    }
    if (a.includes("balanced")) {
      return "Both share a balanced spending style, prioritizing security alongside comfort.";
    }
    if (a.includes("spender")) {
      return "Both share a similar spending style, valuing enjoyment and lifestyle choices.";
    }
  }

  // 10. Finances managed jointly
  if (q.includes("finances") && q.includes("jointly")) {
    if (a.includes("yes")) {
      return "Both prefer joint financial management, promoting transparency and teamwork.";
    }
    if (a.includes("no")) {
      return "Both prefer separate financial management, maintaining financial autonomy.";
    }
    if (a.includes("partially")) {
      return "Both prefer partially joint financial management, balancing shared goals with independence.";
    }
  }

  // 11. Financial planning
  if (q.includes("financial planning")) {
    if (a.includes("very") || a.includes("important")) {
      return "Both place significant importance on financial planning and stability.";
    }
    if (a.includes("moderate") || a.includes("not")) {
      return "Both share a casual, flexible approach to financial planning.";
    }
  }

  // 12. Financial goal
  if (q.includes("financial goal")) {
    if (a.includes("wealth")) {
      return "Both share a primary financial goal of wealth creation, showing long-term ambition.";
    }
    if (a.includes("comfortable")) {
      return "Both prioritize achieving a comfortable, secure life together.";
    }
    if (a.includes("retirement") || a.includes("early")) {
      return "Both work toward early financial independence and retirement.";
    }
    if (a.includes("business")) {
      return "Both share an entrepreneurial mindset focused on business growth.";
    }
  }

  // 13. Daily communication
  if (q.includes("daily communication") || q.includes("communication with your partner")) {
    if (a.includes("extremely") || a.includes("important")) {
      return "Both value frequent and regular communication on a daily basis.";
    }
    if (a.includes("moderate") || a.includes("not")) {
      return "Both prefer a comfortable communication rhythm that allows personal space.";
    }
  }

  // 14. Stress support
  if (q.includes("stress")) {
    if (a.includes("emotional")) {
      return "Both look for emotional comfort and support from their partner during stressful times.";
    }
    if (a.includes("practical")) {
      return "Both value practical solutions and active problem-solving when handling stress.";
    }
    if (a.includes("space") || a.includes("independence")) {
      return "Both prefer personal space and quiet time to process stress independently.";
    }
    if (a.includes("depends")) {
      return "Both believe stress support should adapt to the situation at hand.";
    }
  }

  // 15. Quality matters most
  if (q.includes("quality") && (q.includes("spouse") || q.includes("partner"))) {
    if (a.includes("trust")) {
      return "Both agree that trust is the most critical foundation for their future marriage.";
    }
    if (a.includes("loyalty")) {
      return "Both view unwavering loyalty as the most important quality in a partner.";
    }
    if (a.includes("respect")) {
      return "Both prioritize mutual respect above all else in their relationship.";
    }
    if (a.includes("communication")) {
      return "Both agree that clear and honest communication is the single most important quality.";
    }
    if (a.includes("understanding") || a.includes("emotional")) {
      return "Both value deep emotional understanding and empathy as the core of a marriage.";
    }
  }

  // 16. Why do you want to get married
  if (q.includes("why do you want to get married") || q.includes("why get married") || q.includes("want to get married")) {
    if (a.includes("companionship")) {
      return "Both seek marriage primarily for lifelong companionship and friendship.";
    }
    if (a.includes("family")) {
      return "Both share the goal of building a family and raising children together.";
    }
    if (a.includes("connection") || a.includes("emotional")) {
      return "Both seek a marriage grounded in deep emotional connection.";
    }
    if (a.includes("goals") || a.includes("shared")) {
      return "Both view marriage as a partnership to achieve shared life goals.";
    }
  }

  // 17. Parents involved
  if (q.includes("parents") && q.includes("involved")) {
    if (a.includes("highly")) {
      return "Both value highly active involvement and guidance from parents in major decisions.";
    }
    if (a.includes("moderately")) {
      return "Both prefer moderate parent involvement, balancing family advice with couple decisions.";
    }
    if (a.includes("minimal")) {
      return "Both prefer minimal parent involvement, prioritizing the couple's decision autonomy.";
    }
  }

  // 18. Family or career conflict
  if (q.includes("family") && q.includes("career") && (q.includes("conflict") || q.includes("first"))) {
    if (a.includes("family")) {
      return "Both prioritize family needs over career goals when conflicts arise.";
    }
    if (a.includes("career")) {
      return "Both prioritize career opportunities, supporting each other's professional ambition.";
    }
    if (a.includes("balance")) {
      return "Both strive to find a middle ground and balance family and career during conflicts.";
    }
  }

  // 19. Traditions
  if (q.includes("tradition") || q.includes("custom")) {
    if (a.includes("very") || a.includes("important")) {
      return "Both value cultural traditions and customs highly in their daily lives.";
    }
    if (a.includes("neutral") || a.includes("not")) {
      return "Both take a modern, relaxed approach toward traditional customs.";
    }
  }

  // 20. Parenting style
  if (q.includes("parenting style")) {
    if (a.includes("strict")) {
      return "Both favor a structured and strict approach to raising children.";
    }
    if (a.includes("balanced")) {
      return "Both prefer a balanced parenting style, blending guidance with warmth.";
    }
    if (a.includes("liberal")) {
      return "Both favor a liberal, open parenting style that encourages independence.";
    }
  }

  // 21. Parenting responsibility
  if (q.includes("parenting responsibility") || q.includes("parenting duties")) {
    if (a.includes("both") || a.includes("equally")) {
      return "Both believe in sharing parenting responsibilities equally.";
    }
    if (a.includes("situation") || a.includes("depends")) {
      return "Both feel parenting duties should be divided depending on work/life situations.";
    }
  }

  // 22. Weekend preference
  if (q.includes("weekend")) {
    if (a.includes("home")) {
      return "Both enjoy spending quiet weekends relaxing at home.";
    }
    if (a.includes("family")) {
      return "Both prefer spending weekends with family members.";
    }
    if (a.includes("travel")) {
      return "Both enjoy traveling and exploring new places on weekends.";
    }
    if (a.includes("social")) {
      return "Both love socializing and attending gatherings during their weekends.";
    }
  }

  // 23. Fitness importance
  if (q.includes("fitness")) {
    if (a.includes("very") || a.includes("important")) {
      return "Both place high value on physical fitness and health.";
    }
    if (a.includes("moderate") || a.includes("not")) {
      return "Both view fitness as a moderate or minor focus in their daily routine.";
    }
  }

  // 24. Describes you best
  if (q.includes("describes you best") || q.includes("personality")) {
    if (a.includes("introvert")) {
      return "Both identify as introverts, enjoying quiet environments and reflective time.";
    }
    if (a.includes("extrovert")) {
      return "Both identify as extroverted, thriving in social settings and outgoing activities.";
    }
    if (a.includes("ambivert")) {
      return "Both identify as ambiverts, balancing quiet reflection with social interaction.";
    }
  }

  // 25. Important decisions
  if (q.includes("decision")) {
    if (a.includes("logic")) {
      return "Both lean toward logical analysis when making major life choices.";
    }
    if (a.includes("emotion")) {
      return "Both rely on intuitive feelings and emotional resonance in decision-making.";
    }
    if (a.includes("both")) {
      return "Both prefer a balanced blend of logic and intuition for important decisions.";
    }
  }

  // 26. Adventurous
  if (q.includes("adventurous")) {
    if (a.includes("very")) {
      return "Both share a strong love for adventure and thrilling experiences.";
    }
    if (a.includes("moderately")) {
      return "Both enjoy mild adventure and stepping outside their comfort zone occasionally.";
    }
    if (a.includes("conservative")) {
      return "Both prefer a structured, predictable, and safe lifestyle pace.";
    }
  }

  // 27. Personal space
  if (q.includes("personal space") || q.includes("space")) {
    if (a.includes("very") || a.includes("important")) {
      return "Both recognize the value of personal space and individual activities.";
    }
    if (a.includes("moderate") || a.includes("not")) {
      return "Both prefer high levels of togetherness and shared time.";
    }
  }

  // 28. Settle
  if (q.includes("settle")) {
    if (a.includes("current")) {
      return "Both prefer to settle down in their current city long-term.";
    }
    if (a.includes("metro")) {
      return "Both aspire to settle in a bustling metro city.";
    }
    if (a.includes("abroad")) {
      return "Both share the ambition of living and settling abroad.";
    }
    if (a.includes("flexible")) {
      return "Both keep a flexible outlook on where they will settle in the future.";
    }
  }

  return null;
}

function getMismatchedAnswerSentence(
  question: string,
  targetName: string,
  targetAnswer: string,
  candidateName: string,
  candidateAnswer: string
): string {
  const q = question.toLowerCase();
  const tA = targetAnswer;
  const cA = candidateAnswer;

  if (q.includes("disagreement") || q.includes("conflict")) {
    return `- Different conflict resolution styles: ${targetName} prefers "${tA}" while ${candidateName} prefers "${cA}".`;
  }
  if (q.includes("family setup")) {
    return `- Aligned family setup preferences: ${targetName} prefers "${tA}" while ${candidateName} prefers "${cA}".`;
  }
  if (q.includes("timeline") && q.includes("children")) {
    return `- Different family planning timelines: ${targetName} expects "${tA}" while ${candidateName} expects "${cA}".`;
  }
  if (q.includes("want") && q.includes("children") && !q.includes("timeline")) {
    return `- Differing views on having children: ${targetName} selected "${tA}" while ${candidateName} selected "${cA}".`;
  }
  if (q.includes("partners work") || q.includes("partners should work")) {
    return `- Different perspectives on dual-income setup: ${targetName} prefers "${tA}" while ${candidateName} prefers "${cA}".`;
  }
  if (q.includes("relocate") || q.includes("relocation")) {
    return `- Differing willingness to relocate: ${targetName} selected "${tA}" while ${candidateName} selected "${cA}".`;
  }
  if (q.includes("career growth")) {
    return `- Different priority level on career growth: ${targetName} views it as "${tA}" while ${candidateName} views it as "${cA}".`;
  }
  if (q.includes("lifestyle")) {
    return `- Different preferred lifestyle focus: ${targetName} prefers a "${tA}" lifestyle while ${candidateName} prefers a "${cA}" lifestyle.`;
  }
  if (q.includes("spending")) {
    return `- Aligned spending habits discussion: ${targetName} is a "${tA}" while ${candidateName} is a "${cA}".`;
  }
  if (q.includes("finances") && q.includes("jointly")) {
    return `- Different views on joint financial management: ${targetName} selected "${tA}" while ${candidateName} selected "${cA}".`;
  }
  if (q.includes("financial planning")) {
    return `- Different views on financial planning importance: ${targetName} views it as "${tA}" while ${candidateName} views it as "${cA}".`;
  }
  if (q.includes("financial goal")) {
    return `- Diverging financial goals: ${targetName} targets "${tA}" while ${candidateName} targets "${cA}".`;
  }
  if (q.includes("daily communication") || q.includes("communication with your partner")) {
    return `- Different daily communication expectations: ${targetName} prefers "${tA}" while ${candidateName} prefers "${cA}".`;
  }
  if (q.includes("stress")) {
    return `- Different expectations for support under stress: ${targetName} expects "${tA}" while ${candidateName} expects "${cA}".`;
  }
  if (q.includes("quality") && (q.includes("spouse") || q.includes("partner"))) {
    return `- Different core quality prioritized in a spouse: ${targetName} values "${tA}" most while ${candidateName} values "${cA}".`;
  }
  if (q.includes("why do you want to get married") || q.includes("why get married") || q.includes("want to get married")) {
    return `- Different primary motivations for marriage: ${targetName} seeks "${tA}" while ${candidateName} seeks "${cA}".`;
  }
  if (q.includes("parents") && q.includes("involved")) {
    return `- Different expectations for parent involvement in major decisions: ${targetName} prefers "${tA}" while ${candidateName} prefers "${cA}".`;
  }
  if (q.includes("family") && q.includes("career") && (q.includes("conflict") || q.includes("first"))) {
    return `- Aligned priorities in family/career conflicts: ${targetName} selected "${tA}" while ${candidateName} selected "${cA}".`;
  }
  if (q.includes("tradition") || q.includes("custom")) {
    return `- Different emphasis on traditional values: ${targetName} selected "${tA}" while ${candidateName} selected "${cA}".`;
  }
  if (q.includes("parenting style")) {
    return `- Different preferred parenting styles: ${targetName} leans toward "${tA}" while ${candidateName} leans toward "${cA}".`;
  }
  if (q.includes("parenting responsibility") || q.includes("parenting duties")) {
    return `- Aligned expectations for primary parenting responsibility: ${targetName} selected "${tA}" while ${candidateName} selected "${cA}".`;
  }
  if (q.includes("weekend")) {
    return `- Different weekend activity preferences: ${targetName} prefers "${tA}" while ${candidateName} prefers "${cA}".`;
  }
  if (q.includes("fitness")) {
    return `- Different value placed on physical fitness: ${targetName} selected "${tA}" while ${candidateName} selected "${cA}".`;
  }
  if (q.includes("describes you best") || q.includes("personality")) {
    return `- Different personality tendencies: ${targetName} identifies as "${tA}" while ${candidateName} identifies as "${cA}".`;
  }
  if (q.includes("decision")) {
    return `- Different decision-making styles: ${targetName} relies on "${tA}" while ${candidateName} relies on "${cA}".`;
  }
  if (q.includes("adventurous")) {
    return `- Different levels of adventurousness: ${targetName} is "${tA}" while ${candidateName} is "${cA}".`;
  }
  if (q.includes("personal space") || q.includes("space")) {
    return `- Different priority on personal space: ${targetName} views it as "${tA}" while ${candidateName} views it as "${cA}".`;
  }
  if (q.includes("settle")) {
    return `- Different preferred settlement location: ${targetName} prefers "${tA}" while ${candidateName} prefers "${cA}".`;
  }

  return `- Different answers for "${question}": ${targetName} selected "${targetAnswer}" while ${candidateName} selected "${candidateAnswer}".`;
}

export async function generateAIExplanation(
  target: any,
  candidate: any,
  targetTraits: any,
  candidateTraits: any,
  score: number,
  confidenceScore: number,
  strengths: string[],
  concerns: string[],
  forceFallback = false
): Promise<string> {
  const targetName = target.person?.firstName || "The client";
  const candidateName = candidate.person?.firstName || "the candidate";

  const targetAnswers = target.answers || [];
  const candidateAnswers = candidate.answers || [];

  const matchedQA: { question: string; answer: string }[] = [];
  const mismatchedQA: { question: string; targetAnswer: string; candidateAnswer: string }[] = [];

  for (const tAns of targetAnswers) {
    const rawQText = tAns.question?.questionText || "";
    const cleanQText = getCleanQuestionText(rawQText);
    const cAns = candidateAnswers.find((a: any) => a.questionId === tAns.questionId);
    if (cAns) {
      const tOpt = tAns.selectedOption?.optionText || "";
      const cOpt = cAns.selectedOption?.optionText || "";
      if (tOpt.toLowerCase().trim() === cOpt.toLowerCase().trim()) {
        matchedQA.push({ question: cleanQText, answer: tOpt });
      } else {
        mismatchedQA.push({ question: cleanQText, targetAnswer: tOpt, candidateAnswer: cOpt });
      }
    }
  }

  if (forceFallback || !apiKey) {
    return buildFallbackV2(targetName, candidateName, matchedQA, mismatchedQA, confidenceScore);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
You are an expert matrimonial matchmaker and relationship counselor for MatriMitra.
Your task is to analyze two profiles (Bride and Groom) and generate a structured, natural, and warm matchmaking explanation V2.

Target Profile (User):
- Name: ${targetName}
- Gender: ${target.person?.gender || 'N/A'}
- Age: ${target.person?.dob ? calculateAge(new Date(target.person.dob)) : 'N/A'}
- Education: ${target.educations?.[0]?.qualification || 'N/A'}
- Profession: ${target.careers?.[0]?.profession || 'N/A'}

Candidate Profile:
- Name: ${candidateName}
- Gender: ${candidate.person?.gender || 'N/A'}
- Age: ${candidate.person?.dob ? calculateAge(new Date(candidate.person.dob)) : 'N/A'}
- Education: ${candidate.educations?.[0]?.qualification || 'N/A'}
- Profession: ${candidate.careers?.[0]?.profession || 'N/A'}

Matched Questionnaire Answers (Where both selected the SAME option):
${matchedQA.map(qa => `- Question: "${qa.question}" -> Option Selected: "${qa.answer}"`).join("\n")}

Differing Questionnaire Answers (Where they selected DIFFERENT options):
${mismatchedQA.map(qa => `- Question: "${qa.question}" -> ${targetName} selected "${qa.targetAnswer}" while ${candidateName} selected "${qa.candidateAnswer}"`).join("\n")}

Matching Score Data:
- Compatibility Score: ${score}%
- Confidence Score: ${confidenceScore}%

Generate a structured explanation in plain text with the following sections exactly:

WHY THIS MATCH
[Write 2-4 natural sentences explaining why they are a good fit. Focus strictly on their actual matched questionnaire answers (e.g. joint family preferences, conflict resolution, parenting timeline) rather than generic trait labels. If confidence score is low (< 50%), begin this section with 'Based on available information, ' and append: 'Additional questionnaire responses may improve match accuracy.']

STRENGTHS
[List 3-7 bullet points demonstrating strengths derived from matching answers. Focus on the underlying answers: e.g. "Both prefer discussing disagreements immediately, suggesting a direct and open communication style" instead of "Strong communication compatibility".]

THINGS TO DISCUSS
[List the differences in questionnaire answers only. If there are no differences, show exactly: "No major compatibility concerns identified."]

SUGGESTED FIRST DISCUSSION TOPICS
- Career plans after marriage
- Family expectations
- Financial planning
- Future lifestyle goals

Rules & Constraints:
- Refer to them by first names: ${targetName} and ${candidateName}.
- Keep the tone warm, positive, respectful, yet insightful.
- Do NOT use Markdown formatting (like ** or #) or HTML tags. Output ONLY the plain text sections with headers in uppercase exactly as shown above.
- Do NOT generate explanations mainly from generic trait labels/phrases (like "Strong communication compatibility", "Similar family expectations", "Similar financial habits", "Similar parenting expectations", etc.).
- Instead, you MUST use the underlying answers in your explanation. For example:
  * If they both selected "Discuss immediately" for disagreement handling, output: "Both prefer discussing disagreements immediately, suggesting a direct and open communication style."
  * If they both selected "Joint family" for family setup, output: "Both prefer a joint family environment and value close family relationships."
  * If they both selected "1-2 years" for children timeline, output: "Both share similar expectations regarding family planning and timing for children."
`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Error generating Gemini explanation:", error);
    return buildFallbackV2(targetName, candidateName, matchedQA, mismatchedQA, confidenceScore);
  }
}

function buildFallbackV2(
  targetName: string,
  candidateName: string,
  matchedQA: { question: string; answer: string }[],
  mismatchedQA: { question: string; targetAnswer: string; candidateAnswer: string }[],
  confidenceScore: number
): string {
  // 1. WHY THIS MATCH
  const matchedSentences: string[] = [];

  for (const qa of matchedQA) {
    const sentence = getMatchedAnswerSentence(qa.question, qa.answer);
    if (sentence) {
      matchedSentences.push(sentence);
    }
  }

  if (matchedSentences.length === 0) {
    matchedSentences.push(`${targetName} and ${candidateName} show strong alignment in lifestyle preferences, core values, and cultural expectations.`);
  }

  const whyMatchSentences = matchedSentences.slice(0, 4);
  while (whyMatchSentences.length < 2) {
    whyMatchSentences.push(`They share a strong foundation of mutual understanding and relationship goals.`);
  }

  let whyMatchText = whyMatchSentences.join(" ");
  if (confidenceScore < 50) {
    whyMatchText = `Based on available information, ${whyMatchText} Additional questionnaire responses may improve match accuracy.`;
  }

  // 2. STRENGTHS
  const strengthsList: string[] = [];
  for (const qa of matchedQA) {
    const sentence = getMatchedAnswerSentence(qa.question, qa.answer);
    if (sentence) {
      strengthsList.push(`- ${sentence}`);
    }
  }

  const uniqueStrengths = Array.from(new Set(strengthsList));
  while (uniqueStrengths.length < 3) {
    if (uniqueStrengths.length === 0) {
      uniqueStrengths.push(`- Both show strong compatibility in communication style and relationship approach.`);
    } else if (uniqueStrengths.length === 1) {
      uniqueStrengths.push(`- Both exhibit aligned expectations for lifestyle pace and family integration.`);
    } else {
      uniqueStrengths.push(`- Both share compatible values regarding personal space and decision-making.`);
    }
  }
  const finalStrengths = uniqueStrengths.slice(0, 7);

  // 3. THINGS TO DISCUSS
  const discussList: string[] = [];
  for (const qa of mismatchedQA) {
    discussList.push(getMismatchedAnswerSentence(qa.question, targetName, qa.targetAnswer, candidateName, qa.candidateAnswer));
  }

  const uniqueDiscuss = Array.from(new Set(discussList));
  const discussText = uniqueDiscuss.length > 0
    ? uniqueDiscuss.join("\n")
    : "No major compatibility concerns identified.";

  return `WHY THIS MATCH
${whyMatchText}

STRENGTHS
${finalStrengths.join("\n")}

THINGS TO DISCUSS
${discussText}

SUGGESTED FIRST DISCUSSION TOPICS
- Career plans after marriage
- Family expectations
- Financial planning
- Future lifestyle goals`;
}

export async function generateProfileSummary(profile: any, forceFallback = false): Promise<string> {
  const name = profile.person?.firstName || "The candidate";
  const gender = profile.person?.gender || "N/A";
  const age = profile.person?.dob ? calculateAge(new Date(profile.person.dob)) : "N/A";
  const education = profile.educations?.[0]?.qualification || "N/A";
  const specialization = profile.educations?.[0]?.specialization || "";
  const profession = profile.careers?.[0]?.profession || "N/A";
  const workLocation = profile.careers?.[0]?.workLocation || "N/A";
  const lifestyle = profile.lifestyles?.[0];
  const preferences = profile.preferences?.[0];

  const answers = (profile.answers || []).map((ans: any) => {
    const qText = ans.question?.questionText || "";
    const option = ans.selectedOption?.optionText || "";
    return `- ${qText}: ${option}`;
  }).join("\n");

  if (!apiKey || forceFallback) {
    // Deterministic fallback path
    const targetName = name;
    const professionText = profession && profession !== "N/A" ? `a ${profession.toLowerCase()}` : "a professional";

    // Find family values from questionnaire or default
    const familySetup = profile.answers?.find((a: any) =>
      a.question?.questionText?.toLowerCase().includes("family setup")
    )?.selectedOption?.optionText || "";

    let familyText = "values close family relationships";
    if (familySetup.toLowerCase().includes("joint")) {
      familyText = "values a joint family environment";
    } else if (familySetup.toLowerCase().includes("nuclear")) {
      familyText = "prefers a nuclear family setup";
    }

    const communicationStyle = profile.answers?.find((a: any) =>
      a.question?.questionText?.toLowerCase().includes("handle disagreements")
    )?.selectedOption?.optionText || "";

    let communicationText = "value-driven communication";
    if (communicationStyle.toLowerCase().includes("discuss immediately")) {
      communicationText = "open and direct communication";
    } else if (communicationStyle.toLowerCase().includes("discuss later")) {
      communicationText = "thoughtful and calm communication";
    }

    const preferredLifestyle = profile.answers?.find((a: any) =>
      a.question?.questionText?.toLowerCase().includes("preferred lifestyle")
    )?.selectedOption?.optionText || "";

    const lifestylePace = preferredLifestyle
      ? preferredLifestyle.toLowerCase().replace("focused", "oriented").replace(" lifestyle", "").trim()
      : "balanced";

    // Partner preference text
    const prefReligion = preferences?.religion && preferences.religion !== "N/A" ? `${preferences.religion.toLowerCase()}` : "";
    const prefEducation = preferences?.education && preferences.education !== "N/A" ? `an ${preferences.education.toLowerCase()}` : "";

    let prefText = "";
    if (prefReligion && prefEducation) {
      prefText = `is seeking a partner with a ${prefReligion} background and ${prefEducation} education who shares similar family values and goals.`;
    } else if (prefReligion) {
      prefText = `is seeking a ${prefReligion} partner who shares similar values and long-term goals.`;
    } else if (prefEducation) {
      prefText = `is seeking a partner with ${prefEducation} background who is family-oriented and shares aligned life goals.`;
    } else {
      prefText = `is looking for a partner who shares similar family values, communication styles, and long-term future goals.`;
    }

    return `${targetName} is ${professionText} who ${familyText}, values ${communicationText}, and appreciates a ${lifestylePace} lifestyle. ${gender.toUpperCase() === 'FEMALE' ? 'She' : 'He'} ${prefText}`;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
You are an expert matrimonial matchmaker for MatriMitra.
Your task is to write a warm, professional, and positive user-facing profile summary for ${name}.

Candidate Details:
- Name: ${name}
- Gender: ${gender}
- Age: ${age}
- Education: ${education} ${specialization ? `(Specialized in ${specialization})` : ""}
- Profession: ${profession} ${workLocation ? `based in ${workLocation}` : ""}
- Lifestyle: Food habit: ${lifestyle?.foodHabit || "N/A"}, Smoking: ${lifestyle?.smoking !== null ? (lifestyle?.smoking ? "Yes" : "No") : "N/A"}, Drinking: ${lifestyle?.drinking !== null ? (lifestyle?.drinking ? "Yes" : "No") : "N/A"}
- Questionnaire Answers:
${answers}

Partner Preferences:
- Expected Age: Min ${preferences?.minAge || "N/A"}, Max ${preferences?.maxAge || "N/A"}
- Expected Religion: ${preferences?.religion || "N/A"}
- Expected Education: ${preferences?.education || "N/A"}
- Expected Profession: ${preferences?.profession || "N/A"}

Based on this, write a summary explaining who they are and what they are looking for in a partner.
- Write exactly 2 to 4 sentences.
- Refer to them by their first name: ${name}.
- Keep the tone warm, respectful, and engaging.
- Do NOT include any meta-commentary, markdown headers, or JSON wrapping. Return ONLY the plain text summary.
`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Error generating Gemini profile summary:", error);
    // Graceful fallback to deterministic description on API call failure
    const targetName = name;
    const professionText = profession && profession !== "N/A" ? `a ${profession.toLowerCase()}` : "a professional";
    return `${targetName} is ${professionText} who values family compatibility and healthy relationships. ${gender.toUpperCase() === 'FEMALE' ? 'She' : 'He'} is looking for a compatible partner who shares similar values and long-term goals.`;
  }
}

function calculateAge(dob: any): number | null {
  if (!dob) return null;
  const dobDate = dob instanceof Date ? dob : new Date(dob);
  if (isNaN(dobDate.getTime())) return null;
  const diff = Date.now() - dobDate.getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}

function getConversationStarterFromQA(question: string, answer: string): string | null {
  const q = question.toLowerCase();
  const a = answer.toLowerCase().trim();

  if (q.includes("disagreement") || q.includes("conflict")) {
    if (a.includes("discuss immediately")) {
      return "Both of you prefer discussing disagreements immediately. What does healthy conflict resolution mean to you in marriage?";
    }
    if (a.includes("discuss later") || a.includes("take time")) {
      return "Both of you prefer taking time before discussing disagreements. How do you ensure you circle back to resolve issues constructively?";
    }
  }

  if (q.includes("family setup")) {
    if (a.includes("joint")) {
      return "Both of you value a joint family environment. What does an ideal family setup look like for you after marriage?";
    }
    if (a.includes("nuclear")) {
      return "Both of you prefer a nuclear family setup. How do you envision maintaining relationships with extended family?";
    }
  }

  if (q.includes("timeline") && q.includes("children")) {
    return "You both share similar expectations regarding family planning and timing for children. What are your thoughts on parenting?";
  }

  if (q.includes("want") && q.includes("children") && !q.includes("timeline")) {
    if (a.includes("yes")) {
      return "You both want children in the future. What are your thoughts on parenting and family planning?";
    }
  }

  if (q.includes("career growth")) {
    return "Both of you prioritize career growth. How do you plan to balance professional ambitions with family responsibilities?";
  }

  if (q.includes("spending")) {
    if (a.includes("saver")) {
      return "Both of you identify as savers. How do you plan to handle financial goals, budgeting, and savings as a couple?";
    }
    if (a.includes("balanced")) {
      return "Both of you prefer a balanced spending style. What are your thoughts on managing joint and separate finances?";
    }
  }

  if (q.includes("relocate") || q.includes("relocation")) {
    if (a.includes("yes")) {
      return "You are both willing to relocate for career growth. What factors would you consider when deciding on a new city to settle in?";
    }
  }

  if (q.includes("weekend")) {
    if (a.includes("family")) {
      return "Both of you enjoy spending weekends with family. What are your favorite weekend activities and traditions?";
    }
    if (a.includes("travel")) {
      return "Both of you enjoy traveling on weekends. What have been some of your most memorable travel experiences?";
    }
  }

  if (q.includes("decision")) {
    if (a.includes("logic")) {
      return "Both of you rely on logical analysis for important decisions. How do you support each other when making big life choices?";
    }
  }

  if (q.includes("personal space") || q.includes("space")) {
    if (a.includes("very") || a.includes("important")) {
      return "Both of you recognize the value of personal space. How do you plan to balance shared time with individual hobbies and interests?";
    }
  }

  return null;
}

export async function generateConversationStarters(
  targetProfile: any,
  candidateProfile: any,
  strengths: string[],
  concerns: string[]
): Promise<string[]> {
  const targetAnswers = targetProfile.answers || [];
  const candidateAnswers = candidateProfile.answers || [];

  const matchedQA: { question: string; answer: string }[] = [];
  for (const tAns of targetAnswers) {
    const rawQText = tAns.question?.questionText || "";
    const cleanQText = getCleanQuestionText(rawQText);
    const cAns = candidateAnswers.find((a: any) => a.questionId === tAns.questionId);
    if (cAns) {
      const tOpt = tAns.selectedOption?.optionText || "";
      const cOpt = cAns.selectedOption?.optionText || "";
      if (tOpt.toLowerCase().trim() === cOpt.toLowerCase().trim()) {
        matchedQA.push({ question: cleanQText, answer: tOpt });
      }
    }
  }

  const starters: string[] = [];
  for (const qa of matchedQA) {
    const starter = getConversationStarterFromQA(qa.question, qa.answer);
    if (starter) {
      starters.push(starter);
    }
  }

  const uniqueStarters = Array.from(new Set(starters));

  // Pad with high quality defaults to guarantee exactly 3
  const defaults = [
    "How do you envision balancing career responsibilities and personal life goals after marriage?",
    "What is your expectation regarding family involvement in major life decisions?",
    "How do you prefer to spend weekends and plan your future lifestyle pace together?"
  ];

  for (const def of defaults) {
    if (uniqueStarters.length >= 3) break;
    if (!uniqueStarters.includes(def)) {
      uniqueStarters.push(def);
    }
  }

  return uniqueStarters.slice(0, 3);
}

export async function generateProposalRecommendation(
  target: any,
  candidate: any,
  score: number,
  confidenceScore: number,
  strengths: string[],
  concerns: string[],
  explanation: string,
  forceDeterministic = false
): Promise<{
  recommendationLevel: "STRONGLY_RECOMMENDED" | "RECOMMENDED" | "NEEDS_DISCUSSION" | "NOT_RECOMMENDED";
  successProbability: number;
  recommendationSummary: string;
  strengths: string[];
  risks: string[];
}> {
  const targetName = target.person?.firstName || "The client";
  const candidateName = candidate.person?.firstName || "the candidate";

  // Calculate recommendation level based primarily on finalScore
  let recommendationLevel: "STRONGLY_RECOMMENDED" | "RECOMMENDED" | "NEEDS_DISCUSSION" | "NOT_RECOMMENDED" = "NEEDS_DISCUSSION";
  if (score >= 80) {
    recommendationLevel = "STRONGLY_RECOMMENDED";
  } else if (score >= 60) {
    recommendationLevel = "RECOMMENDED";
  } else if (score >= 45) {
    recommendationLevel = "NEEDS_DISCUSSION";
  } else {
    recommendationLevel = "NOT_RECOMMENDED";
  }

  // Calculate successProbability: starts at finalScore, penalize slightly if confidence is low
  let successProbability = score;
  if (confidenceScore < 50) {
    successProbability = Math.max(0, successProbability - 10);
  }

  if (forceDeterministic || !apiKey) {
    // Deterministic fallback recommendation summary builder
    let recommendationSummary = "";
    let recStrengths: string[] = [];
    let recRisks: string[] = [];

    if (recommendationLevel === "STRONGLY_RECOMMENDED") {
      recommendationSummary = `${targetName} and ${candidateName} show outstanding compatibility. They share highly aligned values, relationship conflict management styles, and family planning timelines, suggesting a strong foundation for a long-term partnership.`;
      recStrengths = strengths.slice(0, 3);
      if (recStrengths.length === 0) {
        recStrengths = ["Strong core value compatibility", "Shared family goals"];
      }
      recRisks = concerns.slice(0, 1);
      if (recRisks.length === 0 || recRisks[0].toLowerCase().includes("no major compatibility")) {
        recRisks = ["Minor lifestyle adjustments"];
      }
    } else if (recommendationLevel === "RECOMMENDED") {
      recommendationSummary = `${targetName} and ${candidateName} represent a solid connection with good overall alignment. They show compatibility in key aspects of lifestyle and communication, though some minor adjustments will be required.`;
      recStrengths = strengths.slice(0, 2);
      if (recStrengths.length === 0) {
        recStrengths = ["Good overall demographic and lifestyle match"];
      }
      recRisks = concerns.slice(0, 2);
      if (recRisks.length === 0 || recRisks[0].toLowerCase().includes("no major compatibility")) {
        recRisks = ["Minor communication or financial habit differences"];
      }
    } else if (recommendationLevel === "NEEDS_DISCUSSION") {
      recommendationSummary = `${targetName} and ${candidateName} show moderate compatibility but highlight some key differences in personality traits, communication, or lifestyles. A direct discussion on their future expectations is recommended.`;
      recStrengths = strengths.slice(0, 2);
      if (recStrengths.length === 0) {
        recStrengths = ["Basic lifestyle preferences match"];
      }
      recRisks = concerns.length > 0 && !concerns[0].toLowerCase().includes("no major compatibility") ? concerns.slice(0, 2) : ["Differing career or traditional expectations"];
    } else {
      recommendationSummary = `${targetName} and ${candidateName} show significant divergence in core matrimonial questionnaire responses and preferences, indicating a high risk of mismatch.`;
      recStrengths = ["Basic demographic alignment"];
      recRisks = ["Substantial conflict-handling or family expectations mismatch", "Aligned life priorities conflict"];
    }

    if (confidenceScore < 50) {
      recRisks.push("Limited questionnaire data creates matching uncertainty.");
    }

    return {
      recommendationLevel,
      successProbability,
      recommendationSummary,
      strengths: recStrengths,
      risks: recRisks
    };
  }

  // Call Gemini for AI Proposal Recommendation
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
You are an expert matrimonial matchmaker. Analyze the compatibility of two profiles:
- Target (User): ${targetName} (${target.person?.gender || 'N/A'}, Age: ${target.person?.dob ? calculateAge(new Date(target.person.dob)) : 'N/A'}, Education: ${target.educations?.[0]?.qualification || 'N/A'}, Profession: ${target.careers?.[0]?.profession || 'N/A'})
- Candidate: ${candidateName} (${candidate.person?.gender || 'N/A'}, Age: ${candidate.person?.dob ? calculateAge(new Date(candidate.person.dob)) : 'N/A'}, Education: ${candidate.educations?.[0]?.qualification || 'N/A'}, Profession: ${candidate.careers?.[0]?.profession || 'N/A'})
- Compatibility Score: ${score}%
- Confidence Score: ${confidenceScore}%
- Matches Questionnaire Strengths: ${JSON.stringify(strengths)}
- Mismatches / Concerns: ${JSON.stringify(concerns)}
- Match Explanation: ${explanation}

Generate a matrimonial proposal recommendation.
Based on the Compatibility Score of ${score}%, set the recommendationLevel to:
- "STRONGLY_RECOMMENDED" (if score >= 80)
- "RECOMMENDED" (if score >= 60 and < 80)
- "NEEDS_DISCUSSION" (if score >= 45 and < 60)
- "NOT_RECOMMENDED" (if score < 45)

Calculate successProbability as exactly ${successProbability}% (reduce slightly if confidence score is low, e.g. < 50).
If the Confidence Score (${confidenceScore}%) is less than 50, you MUST include a risk/warning in the risks list exactly matching the text "Limited questionnaire data causes matching uncertainty." to inform relationship managers of the data gap.

Output strictly a JSON object (no markdown block wrapper, no \`\`\`json, just raw JSON) in this exact format:
{
  "recommendationLevel": "STRONGLY_RECOMMENDED" | "RECOMMENDED" | "NEEDS_DISCUSSION" | "NOT_RECOMMENDED",
  "successProbability": ${successProbability},
  "recommendationSummary": "A warm, professional 2-3 sentence summary about this match recommendation",
  "strengths": ["at least 2 specific strengths from their matched questionnaire answers"],
  "risks": ["at least 1 warning or adjustment point based on differences or low confidence"]
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    const cleanJsonText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJsonText);

    if (parsed.recommendationLevel && typeof parsed.successProbability === 'number') {
      return {
        recommendationLevel: parsed.recommendationLevel,
        successProbability: parsed.successProbability,
        recommendationSummary: parsed.recommendationSummary,
        strengths: parsed.strengths || [],
        risks: parsed.risks || []
      };
    }
    throw new Error("Invalid structure from Gemini");
  } catch (error) {
    console.error("Error generating Gemini proposal recommendation, falling back:", error);
    return generateProposalRecommendation(target, candidate, score, confidenceScore, strengths, concerns, explanation, true);
  }
}

export async function generateAITraits(profile: any): Promise<{
  communicationScore: number;
  familyScore: number;
  careerScore: number;
  financialScore: number;
  lifestyleScore: number;
  emotionalScore: number;
  traditionalScore: number;
  parentingScore: number;
  independenceScore: number;
}> {
  if (!apiKey) {
    throw new Error("Gemini API key is missing");
  }

  const name = profile.person?.firstName || "The client";
  const gender = profile.person?.gender || "N/A";
  const age = profile.person?.dob ? calculateAge(new Date(profile.person.dob)) : "N/A";
  
  const answersFormatted = (profile.answers || []).map((ans: any) => {
    const qText = ans.question?.questionText || "";
    let cleanQ = qText;
    try {
      const parsed = JSON.parse(qText);
      cleanQ = parsed.text || qText;
    } catch {
      cleanQ = qText;
    }
    const option = ans.selectedOption?.optionText || "";
    return `- Question: "${cleanQ}" -> Answer: "${option}"`;
  }).join("\n");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash"
  });

  const prompt = `
You are an expert matrimonial matchmaker and personality psychologist for MatriMitra.
Your task is to analyze the matrimonial questionnaire responses (both multiple-choice and free-text answers) for a user and rate their relationship traits on a scale of 1 to 10.

Profile Data:
- Name: ${name}
- Gender: ${gender}
- Age: ${age}

Questionnaire Responses:
${answersFormatted}

Rate the following 9 traits as integers from 1 (lowest) to 10 (highest):
1. communicationScore: Rating of preference for open, direct, and immediate conflict resolution vs avoidance/indirectness.
2. familyScore: Rating of value placed on joint family environments, parent involvement, and prioritizing family over other needs.
3. careerScore: Rating of career focus, ambition, and work-life priorities.
4. financialScore: Rating of savings orientation, budgeting, and joint financial planning.
5. lifestyleScore: Rating of fitness importance, active travel, and outgoing weekend preferences.
6. emotionalScore: Rating of emotional maturity, expectations of partner support under stress, and relationship values.
7. traditionalScore: Rating of value placed on traditions, customs, and cultural heritage.
8. parentingScore: Rating of interest in having children and sharing parenting responsibilities.
9. independenceScore: Rating of value placed on personal space, individual hobbies, and settling locations (e.g. abroad).

Output strictly a JSON object (no markdown block wrapper, no \`\`\`json, just raw JSON) in this exact format:
{
  "communicationScore": 8,
  "familyScore": 9,
  "careerScore": 7,
  "financialScore": 8,
  "lifestyleScore": 6,
  "emotionalScore": 8,
  "traditionalScore": 9,
  "parentingScore": 9,
  "independenceScore": 5
}
`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();
  const cleanJsonText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleanJsonText);

  const traits = [
    "communicationScore", "familyScore", "careerScore", "financialScore",
    "lifestyleScore", "emotionalScore", "traditionalScore", "parentingScore", "independenceScore"
  ];
  const validated: any = {};
  for (const t of traits) {
    const val = parseInt(parsed[t], 10);
    if (isNaN(val) || val < 1 || val > 10) {
      throw new Error(`Invalid trait score for ${t}: ${parsed[t]}`);
    }
    validated[t] = val;
  }

  return validated;
}

export async function generatePipelineAIRecommendation(input: {
  currentStage: string;
  daysInStage: number;
  proposalStatus: string;
  compatibilityScore: number;
  brideName: string;
  groomName: string;
}): Promise<{
  nextAction: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  suggestedMessage: string;
  expectedNextStage: string;
} | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
You are an expert matchmaking assistant. Analyze the relationship milestone pipeline stage for a couple:
- Bride Name: ${input.brideName}
- Groom Name: ${input.groomName}
- Current Stage: ${input.currentStage}
- Days in this Stage: ${input.daysInStage}
- Proposal Status: ${input.proposalStatus}
- Compatibility Score: ${input.compatibilityScore}%

Provide actionable relationship guidance and communication templates.
Generate the response strictly as a JSON object (no markdown block wrapper, no \`\`\`json, just raw JSON) in this exact format:
{
  "nextAction": "A concise, specific recommendation for the matchmaking manager",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "suggestedMessage": "A warm, professional WhatsApp/SMS follow-up message to send to the client or the other agency. Refer to the clients by name.",
  "expectedNextStage": "The most appropriate next stage from the options: PROPOSAL_SENT, PROFILE_SHARED, INTERESTED, MEETING_SCHEDULED, FAMILY_DISCUSSION, ENGAGEMENT, MARRIED, CLOSED"
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    const cleanJsonText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJsonText);

    return {
      nextAction: parsed.nextAction,
      riskLevel: parsed.riskLevel,
      suggestedMessage: parsed.suggestedMessage,
      expectedNextStage: parsed.expectedNextStage
    };
  } catch (error) {
    console.error("Error generating pipeline recommendation via Gemini:", error);
    return null;
  }
}


