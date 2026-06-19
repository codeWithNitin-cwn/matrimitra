import { prisma } from "../../backend/src/config/prisma.js";
import crypto from "crypto";

async function run() {
  console.log("Starting Reddy Matrimony profiles seeding...");

  // 1. Get Reddy Matrimony agency and user
  const agency = await prisma.agency.findFirst({
    where: { name: "Reddy Matrimony" }
  });
  if (!agency) {
    console.error("Reddy Matrimony agency not found.");
    process.exit(1);
  }

  const agencyUser = await prisma.agencyUser.findFirst({
    where: { username: "reddyowner" }
  });
  if (!agencyUser) {
    console.error("User 'reddyowner' not found.");
    process.exit(1);
  }

  const assignedUserId = agencyUser.id;

  console.log(`Using Agency: ${agency.name} (${agency.id})`);
  console.log(`Assigned User: ${agencyUser.username} (${assignedUserId})`);

  // Fetch all questions and options
  const dbQuestions = await prisma.question.findMany({
    include: { options: true }
  });

  if (dbQuestions.length === 0) {
    console.error("No questions found in database. Please run seed_questions.ts first.");
    process.exit(1);
  }

  // 2. Define profile structures
  const profilesData = [
    {
      // Profile 1: Sravani Reddy (Bride)
      firstName: "Sravani",
      lastName: "Reddy",
      gender: "FEMALE",
      dob: new Date("1997-08-20"),
      relationshipToClient: "DAUGHTER",
      clientMobile: "9123456789",
      clientEmail: "prabhakar.reddy@example.com",
      clientAddress: "Flat 101, Srinivasa Residency, Madhapur, Hyderabad, Telangana",
      clientFirstName: "Prabhakar",
      clientLastName: "Reddy",
      
      personal: {
        religion: "Hindu",
        caste: "Reddy",
        subCaste: "Motati",
        motherTongue: "Telugu",
        heightCm: 163,
        weightKg: 55,
        maritalStatus: "NEVER_MARRIED",
        state: "Telangana",
        country: "India",
        city: "Hyderabad"
      },
      education: {
        degree: "M.S.",
        specialization: "Data Science",
        institution: "University of Texas at Dallas",
        graduationYear: 2021
      },
      career: {
        profession: "Data Analyst",
        employer: "Microsoft India",
        designation: "Senior Data Analyst",
        annualIncome: 2400000,
        workLocation: "Hyderabad"
      },
      family: {
        fatherName: "Prabhakar Reddy",
        motherName: "Laxmi Reddy",
        fatherOccupation: "Real Estate Business",
        motherOccupation: "Homemaker",
        familyType: "Nuclear",
        familyValues: "Moderate",
        siblingsCount: 1,
        siblingsDetails: "One elder brother married and working in USA."
      },
      lifestyle: {
        foodHabit: "Non-vegetarian",
        smoking: false,
        drinking: false,
        fitnessLevel: "Active",
        hobbies: ["Photography", "Cooking traditional Telugu food", "Kuchipudi dance"]
      },
      preferences: {
        minAge: 28,
        maxAge: 32,
        minHeight: 172,
        maxHeight: 185,
        religion: "Hindu",
        caste: "Reddy",
        city: "Hyderabad, Bengaluru, USA",
        education: "Master's / MBA / B.Tech from reputed institute",
        profession: "Software Engineer, Business Leader, Corporate Professional",
        smokingPreference: false,
        drinkingPreference: false,
        childrenPreference: "Wants children",
        familySetupPreference: "Flexible",
        relocationPreference: "Open to relocate"
      },
      answers: {
        "disagreements": { option: "Discuss immediately", importance: "MUST_HAVE" },
        "daily communication": { option: "Important", importance: "MUST_HAVE" },
        "stressed": { option: "Space and independence", importance: "NICE_TO_HAVE" },
        "spouse": { option: "Trust", importance: "MUST_HAVE" },
        "why": { option: "Companionship", importance: "NICE_TO_HAVE" },
        "setup": { option: "Nuclear family", importance: "MUST_HAVE" },
        "parents": { option: "Moderately involved", importance: "NICE_TO_HAVE" },
        " conflicts": { option: "Balance both", importance: "MUST_HAVE" },
        "traditions": { option: "Important", importance: "MUST_HAVE" },
        "children": { option: "Yes", importance: "MUST_HAVE" },
        "timeline": { option: "1-2 years", importance: "NICE_TO_HAVE" },
        "parenting": { option: "Balanced", importance: "NICE_TO_HAVE" },
        "responsibility": { option: "Both equally", importance: "MUST_HAVE" },
        "work": { option: "Yes", importance: "MUST_HAVE" },
        "relocate": { option: "Yes", importance: "NICE_TO_HAVE" },
        "growth": { option: "Extremely important", importance: "MUST_HAVE" },
        "lifestyle": { option: "Balanced", importance: "MUST_HAVE" },
        "spending": { option: "Balanced", importance: "NICE_TO_HAVE" },
        "jointly": { option: "Yes", importance: "MUST_HAVE" },
        "planning": { option: "Very important", importance: "MUST_HAVE" },
        "goal": { option: "Comfortable life", importance: "NICE_TO_HAVE" },
        "food": { option: "Non-vegetarian", importance: "MUST_HAVE" },
        "smoking habit": { option: "Never", importance: "MUST_HAVE" },
        "drinking habit": { option: "Never", importance: "MUST_HAVE" },
        "weekend": { option: "Family", importance: "NICE_TO_HAVE" },
        "fitness": { option: "Important", importance: "NICE_TO_HAVE" },
        "best": { option: "Ambivert", importance: "DOESNT_MATTER" },
        "decisions": { option: "Both", importance: "NICE_TO_HAVE" },
        "adventurous": { option: "Moderately adventurous", importance: "NICE_TO_HAVE" },
        "personal space": { option: "Very important", importance: "MUST_HAVE" },
        "settle": { option: "Flexible", importance: "NICE_TO_HAVE" },
        "successful marriage": "A successful marriage is built on deep mutual respect, strong family bonding, and equal support in career ambitions.",
        "biggest expectation": "Intellectual compatibility, transparency, and a loving heart.",
        "top 3 life goals": "Achieve leadership in Data Analytics, visit all scenic places in Europe, and build a beautiful home in Hyderabad.",
        "dream life after 10 years": "Having a senior tech position, maintaining a warm and welcoming home for family and friends, and watching children grow up with strong values.",
        "future family": "A progressive yet traditional Telugu family where love, respect, and academic excellence are given high priority.",
        "never be compromised": "Family values, integrity, and independence.",
        "ideal life partner": "A Reddy professional with a progressive mindset, working in Hyderabad or open to US opportunities, who values family roots.",
        "past relationships": "Clear expression of thoughts early on avoids long-term issues.",
        "define love": "Love is consistent support, laughter, and safe comfort.",
        "support do you expect": "Understanding during stressful work cycles and active help in balancing work-life duties.",
        "spouse do you want to become": "An empathetic, cheerful, and encouraging life partner who keeps the home environment positive.",
        "deeply understood": "When my partner respects my choices and supports my professional goals without hesitation.",
        "want them to know": "I am simple, family-oriented, love learning new things, and value relationships deeply."
      }
    },
    {
      // Profile 2: Keerthana Reddy (Bride)
      firstName: "Keerthana",
      lastName: "Reddy",
      gender: "FEMALE",
      dob: new Date("1995-12-05"),
      relationshipToClient: "SISTER",
      clientMobile: "9234567890",
      clientEmail: "anand.reddy@example.com",
      clientAddress: "32, MLA Colony, Banjara Hills, Hyderabad, Telangana",
      clientFirstName: "Anand",
      clientLastName: "Reddy",
      
      personal: {
        religion: "Hindu",
        caste: "Reddy",
        subCaste: "Gudati",
        motherTongue: "Telugu",
        heightCm: 165,
        weightKg: 58,
        maritalStatus: "NEVER_MARRIED",
        state: "Telangana",
        country: "India",
        city: "Hyderabad"
      },
      education: {
        degree: "M.D.",
        specialization: "Pediatrics",
        institution: "Osmania Medical College",
        graduationYear: 2020
      },
      career: {
        profession: "Doctor / Pediatrician",
        employer: "Apollo Hospitals",
        designation: "Consultant Pediatrician",
        annualIncome: 3000000,
        workLocation: "Hyderabad"
      },
      family: {
        fatherName: "Anand Reddy",
        motherName: "Sujatha Reddy",
        fatherOccupation: "Senior Government Officer",
        motherOccupation: "Homemaker",
        familyType: "Nuclear",
        familyValues: "Moderate",
        siblingsCount: 2,
        siblingsDetails: "One elder brother working as software architect, one younger sister studying MBBS."
      },
      lifestyle: {
        foodHabit: "Non-vegetarian",
        smoking: false,
        drinking: false,
        fitnessLevel: "Yoga regular",
        hobbies: ["Gardening", "Classical singing", "Reading healthcare articles", "Volunteering"]
      },
      preferences: {
        minAge: 29,
        maxAge: 33,
        minHeight: 175,
        maxHeight: 188,
        religion: "Hindu",
        caste: "Reddy",
        city: "Hyderabad, Vizag, Bengaluru",
        education: "Doctor, MBA, MS, or IAS/IPS Officer",
        profession: "Doctor, Corporate Professional, IAS/IPS, Business Owner",
        smokingPreference: false,
        drinkingPreference: false,
        childrenPreference: "Wants children",
        familySetupPreference: "Flexible",
        relocationPreference: "Prefer Hyderabad or major cities"
      },
      answers: {
        "disagreements": { option: "Take time and discuss later", importance: "NICE_TO_HAVE" },
        "daily communication": { option: "Extremely important", importance: "MUST_HAVE" },
        "stressed": { option: "Emotional support", importance: "MUST_HAVE" },
        "spouse": { option: "Respect", importance: "MUST_HAVE" },
        "why": { option: "Companionship", importance: "MUST_HAVE" },
        "setup": { option: "Either", importance: "NICE_TO_HAVE" },
        "parents": { option: "Highly involved", importance: "MUST_HAVE" },
        " conflicts": { option: "Family first", importance: "NICE_TO_HAVE" },
        "traditions": { option: "Very important", importance: "MUST_HAVE" },
        "children": { option: "Yes", importance: "MUST_HAVE" },
        "timeline": { option: "1-2 years", importance: "NICE_TO_HAVE" },
        "parenting": { option: "Balanced", importance: "NICE_TO_HAVE" },
        "responsibility": { option: "Both equally", importance: "MUST_HAVE" },
        "work": { option: "Yes", importance: "MUST_HAVE" },
        "relocate": { option: "Depends", importance: "MUST_HAVE" },
        "growth": { option: "Important", importance: "NICE_TO_HAVE" },
        "lifestyle": { option: "Family focused", importance: "NICE_TO_HAVE" },
        "spending": { option: "Saver", importance: "MUST_HAVE" },
        "jointly": { option: "Yes", importance: "NICE_TO_HAVE" },
        "planning": { option: "Very important", importance: "MUST_HAVE" },
        "goal": { option: "Comfortable life", importance: "NICE_TO_HAVE" },
        "food": { option: "Non-vegetarian", importance: "MUST_HAVE" },
        "smoking habit": { option: "Never", importance: "MUST_HAVE" },
        "drinking habit": { option: "Never", importance: "MUST_HAVE" },
        "weekend": { option: "Family", importance: "NICE_TO_HAVE" },
        "fitness": { option: "Important", importance: "NICE_TO_HAVE" },
        "best": { option: "Introvert", importance: "DOESNT_MATTER" },
        "decisions": { option: "Both", importance: "NICE_TO_HAVE" },
        "adventurous": { option: "Conservative", importance: "NICE_TO_HAVE" },
        "personal space": { option: "Important", importance: "NICE_TO_HAVE" },
        "settle": { option: "Current city", importance: "MUST_HAVE" },
        "successful marriage": "A successful marriage is when partners share common ethics, respect each other's career callings (like medical duties), and hold family above all.",
        "biggest expectation": "Unconditional trust, stability, and emotional warmth.",
        "top 3 life goals": "Start my own pediatric clinic, establish a children welfare NGO, and lead a balanced family life.",
        "dream life after 10 years": "Operating a successful clinic, traveling the world on holidays, and having a happy family home.",
        "future family": "A supportive, warm household where education and service to society are encouraged.",
        "never be compromised": "Professional ethics, family respect, and trust.",
        "ideal life partner": "A qualified Reddy doctor or corporate professional who is well-settled in Hyderabad, has a balanced outlook, and respects relationships.",
        "past relationships": "Patience and understanding are key to handling stressful schedules in medical professions.",
        "define love": "Love is caring, supporting each other's dreams, and standing strong together during tough times.",
        "support do you expect": "Empathy during my long hospital shifts and mutual contribution in household decisions.",
        "spouse do you want to become": "A caring, loving, and supportive partner who makes the home a peaceful sanctuary.",
        "deeply understood": "When my spouse understands my fatigue after a long shift and offers support without me asking.",
        "want them to know": "I am deeply dedicated to my patients, value simple family moments, and practice yoga daily."
      }
    },
    {
      // Profile 3: Karthik Reddy (Groom)
      firstName: "Karthik",
      lastName: "Reddy",
      gender: "MALE",
      dob: new Date("1992-04-18"),
      relationshipToClient: "SELF",
      clientMobile: "9345678901",
      clientEmail: "karthik.reddy@example.com",
      clientAddress: "7A, Cyber Hills, Gachibowli, Hyderabad, Telangana",
      clientFirstName: "Karthik",
      clientLastName: "Reddy",
      
      personal: {
        religion: "Hindu",
        caste: "Reddy",
        subCaste: "Pokanati",
        motherTongue: "Telugu",
        heightCm: 179,
        weightKg: 78,
        maritalStatus: "NEVER_MARRIED",
        state: "Telangana",
        country: "India",
        city: "Hyderabad"
      },
      education: {
        degree: "B.Tech",
        specialization: "Computer Science",
        institution: "BITS Pilani",
        graduationYear: 2014
      },
      career: {
        profession: "Software Architect",
        employer: "Salesforce India",
        designation: "Lead Enterprise Architect",
        annualIncome: 4200000,
        workLocation: "Hyderabad"
      },
      family: {
        fatherName: "Malleswara Reddy",
        motherName: "Sharda Reddy",
        fatherOccupation: "Business Owner",
        motherOccupation: "Homemaker",
        familyType: "Nuclear",
        familyValues: "Moderate",
        siblingsCount: 1,
        siblingsDetails: "One younger sister married and settled in Bangalore."
      },
      lifestyle: {
        foodHabit: "Non-vegetarian",
        smoking: false,
        drinking: false,
        fitnessLevel: "Gym regular",
        hobbies: ["Trekking", "Investments", "Technology blogging", "Watching cricket"]
      },
      preferences: {
        minAge: 26,
        maxAge: 30,
        minHeight: 157,
        maxHeight: 172,
        religion: "Hindu",
        caste: "Reddy",
        city: "Hyderabad, Bengaluru, Chennai",
        education: "B.Tech / MBA / MS from top-tier institutions",
        profession: "Working professional in Tech, Finance, or Management",
        smokingPreference: false,
        drinkingPreference: false,
        childrenPreference: "Wants children",
        familySetupPreference: "Nuclear or Joint",
        relocationPreference: "Prefer Hyderabad"
      },
      answers: {
        "disagreements": { option: "Discuss immediately", importance: "NICE_TO_HAVE" },
        "daily communication": { option: "Important", importance: "NICE_TO_HAVE" },
        "stressed": { option: "Practical solutions", importance: "NICE_TO_HAVE" },
        "spouse": { option: "Trust", importance: "MUST_HAVE" },
        "why": { option: "Companionship", importance: "NICE_TO_HAVE" },
        "setup": { option: "Nuclear family", importance: "NICE_TO_HAVE" },
        "parents": { option: "Moderately involved", importance: "NICE_TO_HAVE" },
        " conflicts": { option: "Balance both", importance: "MUST_HAVE" },
        "traditions": { option: "Important", importance: "NICE_TO_HAVE" },
        "children": { option: "Yes", importance: "MUST_HAVE" },
        "timeline": { option: "1-2 years", importance: "NICE_TO_HAVE" },
        "parenting": { option: "Balanced", importance: "NICE_TO_HAVE" },
        "responsibility": { option: "Both equally", importance: "MUST_HAVE" },
        "work": { option: "Yes", importance: "MUST_HAVE" },
        "relocate": { option: "Yes", importance: "NICE_TO_HAVE" },
        "growth": { option: "Important", importance: "NICE_TO_HAVE" },
        "lifestyle": { option: "Balanced", importance: "MUST_HAVE" },
        "spending": { option: "Balanced", importance: "MUST_HAVE" },
        "jointly": { option: "Yes", importance: "NICE_TO_HAVE" },
        "planning": { option: "Very important", importance: "MUST_HAVE" },
        "goal": { option: "Wealth creation", importance: "NICE_TO_HAVE" },
        "food": { option: "Non-vegetarian", importance: "MUST_HAVE" },
        "smoking habit": { option: "Never", importance: "MUST_HAVE" },
        "drinking habit": { option: "Never", importance: "MUST_HAVE" },
        "weekend": { option: "Social gatherings", importance: "NICE_TO_HAVE" },
        "fitness": { option: "Important", importance: "NICE_TO_HAVE" },
        "best": { option: "Ambivert", importance: "DOESNT_MATTER" },
        "decisions": { option: "Logic", importance: "MUST_HAVE" },
        "adventurous": { option: "Moderately adventurous", importance: "NICE_TO_HAVE" },
        "personal space": { option: "Important", importance: "NICE_TO_HAVE" },
        "settle": { option: "Current city", importance: "MUST_HAVE" },
        "successful marriage": "A successful marriage requires realistic expectations, practical support, financial discipline, and a strong sense of humor.",
        "biggest expectation": "A supportive partner who has an active career view and a positive vibe.",
        "top 3 life goals": "Reach director level in Tech, build a diverse investment portfolio, and travel to South America.",
        "dream life after 10 years": "Leading a software division, mentoring startups, and running a peaceful household with my spouse and children.",
        "future family": "A progressive home where education, sports, and family relationships are highly valued.",
        "never be compromised": "Honesty, financial responsibility, and independence.",
        "ideal life partner": "A Reddy girl with a strong educational background, preferably in tech or business, who is career-driven yet values family.",
        "past relationships": "Direct conversations solve 90% of issues early before they escalate.",
        "define love": "Love is consistent support, safety, friendship, and growing together.",
        "support do you expect": "Understanding during high-growth, demanding work phases and active partnership in decisions.",
        "spouse do you want to become": "A reliable, caring, and rational partner who stands strong during testing times.",
        "deeply understood": "When my partner recognizes the efforts I make to secure our family's long-term comfort.",
        "want them to know": "I am very passionate about outdoor activities, stock market investing, and value honesty above everything."
      }
    },
    {
      // Profile 4: Vamsi Krishna Reddy (Groom)
      firstName: "Vamsi Krishna",
      lastName: "Reddy",
      gender: "MALE",
      dob: new Date("1994-06-25"),
      relationshipToClient: "SON",
      clientMobile: "9456789012",
      clientEmail: "raghuram.reddy@example.com",
      clientAddress: "12/A, Road No 5, Jubilee Hills, Hyderabad, Telangana",
      clientFirstName: "Raghuram",
      clientLastName: "Reddy",
      
      personal: {
        religion: "Hindu",
        caste: "Reddy",
        subCaste: "Pakanati",
        motherTongue: "Telugu",
        heightCm: 182,
        weightKg: 81,
        maritalStatus: "NEVER_MARRIED",
        state: "Telangana",
        country: "India",
        city: "Hyderabad"
      },
      education: {
        degree: "MBA",
        specialization: "Operations",
        institution: "IIM Ahmedabad",
        graduationYear: 2018
      },
      career: {
        profession: "Operations Director",
        employer: "Amazon India",
        designation: "Operations Manager",
        annualIncome: 3500000,
        workLocation: "Hyderabad"
      },
      family: {
        fatherName: "Raghuram Reddy",
        motherName: "Kamala Reddy",
        fatherOccupation: "Contractor & Agriculturist",
        motherOccupation: "Homemaker",
        familyType: "Joint",
        familyValues: "Moderate",
        siblingsCount: 1,
        siblingsDetails: "One younger brother studying MS in USA."
      },
      lifestyle: {
        foodHabit: "Non-vegetarian",
        smoking: false,
        drinking: false,
        fitnessLevel: "Active Runner",
        hobbies: ["Running marathons", "Watching political debates", "Agriculture/Farming", "Exploring local history"]
      },
      preferences: {
        minAge: 25,
        maxAge: 29,
        minHeight: 160,
        maxHeight: 175,
        religion: "Hindu",
        caste: "Reddy",
        city: "Hyderabad, Bengaluru, Andhra Pradesh",
        education: "Graduate or Postgraduate from reputed institute",
        profession: "Open to career-oriented or home managers",
        smokingPreference: false,
        drinkingPreference: false,
        childrenPreference: "Wants children",
        familySetupPreference: "Flexible",
        relocationPreference: "Prefer Hyderabad"
      },
      answers: {
        "disagreements": { option: "Discuss immediately", importance: "NICE_TO_HAVE" },
        "daily communication": { option: "Important", importance: "NICE_TO_HAVE" },
        "stressed": { option: "Emotional support", importance: "NICE_TO_HAVE" },
        "spouse": { option: "Loyalty", importance: "MUST_HAVE" },
        "why": { option: "Family building", importance: "MUST_HAVE" },
        "setup": { option: "Either", importance: "NICE_TO_HAVE" },
        "parents": { option: "Highly involved", importance: "MUST_HAVE" },
        " conflicts": { option: "Family first", importance: "MUST_HAVE" },
        "traditions": { option: "Very important", importance: "MUST_HAVE" },
        "children": { option: "Yes", importance: "MUST_HAVE" },
        "timeline": { option: "1-2 years", importance: "NICE_TO_HAVE" },
        "parenting": { option: "Balanced", importance: "NICE_TO_HAVE" },
        "responsibility": { option: "Both equally", importance: "MUST_HAVE" },
        "work": { option: "Yes", importance: "NICE_TO_HAVE" },
        "relocate": { option: "Depends", importance: "MUST_HAVE" },
        "growth": { option: "Important", importance: "NICE_TO_HAVE" },
        "lifestyle": { option: "Family focused", importance: "MUST_HAVE" },
        "spending": { option: "Saver", importance: "MUST_HAVE" },
        "jointly": { option: "Yes", importance: "NICE_TO_HAVE" },
        "planning": { option: "Very important", importance: "MUST_HAVE" },
        "goal": { option: "Comfortable life", importance: "NICE_TO_HAVE" },
        "food": { option: "Non-vegetarian", importance: "MUST_HAVE" },
        "smoking habit": { option: "Never", importance: "MUST_HAVE" },
        "drinking habit": { option: "Never", importance: "MUST_HAVE" },
        "weekend": { option: "Family", importance: "NICE_TO_HAVE" },
        "fitness": { option: "Important", importance: "NICE_TO_HAVE" },
        "best": { option: "Ambivert", importance: "DOESNT_MATTER" },
        "decisions": { option: "Both", importance: "NICE_TO_HAVE" },
        "adventurous": { option: "Moderately adventurous", importance: "NICE_TO_HAVE" },
        "personal space": { option: "Important", importance: "NICE_TO_HAVE" },
        "settle": { option: "Current city", importance: "MUST_HAVE" },
        "successful marriage": "A successful marriage means keeping our families connected, respecting traditional values, and raising children in a stable, loving environment.",
        "biggest expectation": "Loyalty, family values, and a cheerful attitude.",
        "top 3 life goals": "Expand our agricultural ventures in AP, rise to VP of Operations, and lead a peaceful family life in Hyderabad.",
        "dream life after 10 years": "Managing large logistics operations, visiting our organic farms on weekends, and spending quality family evenings.",
        "future family": "A traditional, warm family where values of elders and hospitality are preserved.",
        "never be compromised": "Respect for family, cultural roots, and trust.",
        "ideal life partner": "A Reddy girl from Andhra Pradesh or Telangana who respects family values, is traditional, and willing to settle in Hyderabad.",
        "past relationships": "Family support is the greatest pillar when navigating life's ups and downs.",
        "define love": "Love is deep commitment, protection, and raising a happy family together.",
        "support do you expect": "Encouraging my agricultural pursuits and managing family events with grace.",
        "spouse do you want to become": "A responsible, caring, and protective partner who provides financial and emotional security.",
        "deeply understood": "When my spouse respects my parents and shares my attachment to our agricultural roots.",
        "want them to know": "I am deeply connected to my home town, love farming, and run marathons regularly."
      }
    },
    {
      // Profile 5: Naveen Reddy (Groom)
      firstName: "Naveen",
      lastName: "Reddy",
      gender: "MALE",
      dob: new Date("1990-11-12"),
      relationshipToClient: "SON",
      clientMobile: "9567890123",
      clientEmail: "subba.reddy@example.com",
      clientAddress: "Green meadows, Guntur, Andhra Pradesh",
      clientFirstName: "Subba",
      clientLastName: "Reddy",
      
      personal: {
        religion: "Hindu",
        caste: "Reddy",
        subCaste: "Desur",
        motherTongue: "Telugu",
        heightCm: 177,
        weightKg: 76,
        maritalStatus: "NEVER_MARRIED",
        state: "Andhra Pradesh",
        country: "India",
        city: "Guntur"
      },
      education: {
        degree: "M.S.",
        specialization: "Mechanical Engineering",
        institution: "Arizona State University",
        graduationYear: 2014
      },
      career: {
        profession: "Industrialist",
        employer: "Reddy Polymers & Pipes",
        designation: "Managing Director",
        annualIncome: 6000000,
        workLocation: "Guntur"
      },
      family: {
        fatherName: "Subba Reddy",
        motherName: "Saraswathi Reddy",
        fatherOccupation: "Industrialist",
        motherOccupation: "Homemaker",
        familyType: "Joint",
        familyValues: "Traditional",
        siblingsCount: 1,
        siblingsDetails: "One elder sister married and settled in Nellore."
      },
      lifestyle: {
        foodHabit: "Non-vegetarian",
        smoking: false,
        drinking: false,
        fitnessLevel: "Active",
        hobbies: ["Long drives", "Badminton", "Industrial research", "Watching Telugu movies"]
      },
      preferences: {
        minAge: 25,
        maxAge: 30,
        minHeight: 155,
        maxHeight: 170,
        religion: "Hindu",
        caste: "Reddy",
        city: "Guntur, Vijayawada, Hyderabad, Nellore",
        education: "Graduate or Postgraduate from reputed college",
        profession: "Open to career-oriented or family manager",
        smokingPreference: false,
        drinkingPreference: false,
        childrenPreference: "Wants children",
        familySetupPreference: "Joint preferred",
        relocationPreference: "Settle in Guntur/Vijayawada"
      },
      answers: {
        "disagreements": { option: "Take time and discuss later", importance: "NICE_TO_HAVE" },
        "daily communication": { option: "Important", importance: "NICE_TO_HAVE" },
        "stressed": { option: "Practical solutions", importance: "NICE_TO_HAVE" },
        "spouse": { option: "Loyalty", importance: "MUST_HAVE" },
        "why": { option: "Family building", importance: "MUST_HAVE" },
        "setup": { option: "Joint family", importance: "MUST_HAVE" },
        "parents": { option: "Highly involved", importance: "MUST_HAVE" },
        " conflicts": { option: "Family first", importance: "MUST_HAVE" },
        "traditions": { option: "Very important", importance: "MUST_HAVE" },
        "children": { option: "Yes", importance: "MUST_HAVE" },
        "timeline": { option: "1-2 years", importance: "NICE_TO_HAVE" },
        "parenting": { option: "Balanced", importance: "NICE_TO_HAVE" },
        "responsibility": { option: "Both equally", importance: "MUST_HAVE" },
        "work": { option: "Yes", importance: "NICE_TO_HAVE" },
        "relocate": { option: "No", importance: "MUST_HAVE" },
        "growth": { option: "Important", importance: "NICE_TO_HAVE" },
        "lifestyle": { option: "Family focused", importance: "MUST_HAVE" },
        "spending": { option: "Saver", importance: "MUST_HAVE" },
        "jointly": { option: "Yes", importance: "NICE_TO_HAVE" },
        "planning": { option: "Very important", importance: "MUST_HAVE" },
        "goal": { option: "Business growth", importance: "MUST_HAVE" },
        "food": { option: "Non-vegetarian", importance: "MUST_HAVE" },
        "smoking habit": { option: "Never", importance: "MUST_HAVE" },
        "drinking habit": { option: "Never", importance: "MUST_HAVE" },
        "weekend": { option: "Family", importance: "NICE_TO_HAVE" },
        "fitness": { option: "Important", importance: "NICE_TO_HAVE" },
        "best": { option: "Extrover", importance: "DOESNT_MATTER" },
        "decisions": { option: "Both", importance: "NICE_TO_HAVE" },
        "adventurous": { option: "Moderately adventurous", importance: "NICE_TO_HAVE" },
        "personal space": { option: "Important", importance: "NICE_TO_HAVE" },
        "settle": { option: "Current city", importance: "MUST_HAVE" },
        "successful marriage": "A successful marriage is built on mutual adaptation, deep loyalty, and maintaining the unity of the joint family setup.",
        "biggest expectation": "Family dedication, loyalty, and a warm nature.",
        "top 3 life goals": "Expand our industrial polymer business, build a community center in Guntur, and raise children with strong cultural values.",
        "dream life after 10 years": "Managing multiple factories, leading community programs, and living in a lively joint family home.",
        "future family": "A traditional, large joint family home where values, culture, and business unity are celebrated daily.",
        "never be compromised": "Respect for family elders, trust, and business integrity.",
        "ideal life partner": "A Reddy girl from AP who values joint families, is respectful, and willing to settle in Guntur.",
        "past relationships": "Listening to elders' advice helps in solving most family differences.",
        "define love": "Love is duty, dedication, and building a prosperous home together.",
        "support do you expect": "Understanding my business travel needs and maintaining family relationships warmly.",
        "spouse do you want to become": "A responsible, stable, and protective partner who leads the family with care.",
        "deeply understood": "When my partner appreciates the responsibility of running our family business and supports it.",
        "want them to know": "I am very close to my parents, run a business in Guntur, and love driving on highways."
      }
    }
  ];

  // 3. Insert each profile
  for (const p of profilesData) {
    const existingProfile = await prisma.agencyProfile.findFirst({
      where: {
        agencyId: agency.id,
        person: {
          firstName: p.firstName,
          lastName: p.lastName
        }
      }
    });

    if (existingProfile) {
      console.log(`Profile already exists: ${p.firstName} ${p.lastName}. Skipping.`);
      continue;
    }

    const person = await prisma.person.create({
      data: {
        firstName: p.firstName,
        lastName: p.lastName,
        gender: p.gender,
        dob: p.dob
      }
    });

    let client = await prisma.client.findFirst({
      where: {
        agencyId: agency.id,
        mobile: p.clientMobile,
        email: p.clientEmail
      }
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          agencyId: agency.id,
          firstName: p.clientFirstName,
          lastName: p.clientLastName,
          email: p.clientEmail,
          mobile: p.clientMobile,
          address: p.clientAddress,
          clientCode: `CL-${p.firstName.toUpperCase()}-${crypto.randomBytes(3).toString("hex")}`
        }
      });
      console.log(`Created client: ${client.firstName} ${client.lastName || ""} (${client.clientCode})`);
    } else {
      console.log(`Using existing client: ${client.firstName} ${client.lastName || ""} (${client.clientCode})`);
    }

    const randomSuffix = crypto.randomBytes(3).toString("hex");
    const profileNumber = `PR-${Date.now()}-${randomSuffix}`;

    const profile = await prisma.agencyProfile.create({
      data: {
        agencyId: agency.id,
        personId: person.id,
        clientId: client.id,
        profileNumber,
        profileType: p.gender === "FEMALE" ? "BRIDE" : "GROOM",
        relationshipToClient: p.relationshipToClient,
        assignedUserId,
        status: "ACTIVE",
        clientApproved: true,
        agencyApproved: true
      }
    });

    // Sub-records creation
    await prisma.profilePersonal.create({
      data: {
        profileId: profile.id,
        religion: p.personal.religion,
        caste: p.personal.caste,
        subCaste: p.personal.subCaste,
        motherTongue: p.personal.motherTongue,
        heightCm: p.personal.heightCm,
        weightKg: p.personal.weightKg,
        maritalStatus: p.personal.maritalStatus,
        city: p.personal.city,
        state: p.personal.state,
        country: p.personal.country
      }
    });

    await prisma.profileEducation.create({
      data: {
        profileId: profile.id,
        qualification: p.education.degree,
        specialization: p.education.specialization,
        institution: p.education.institution,
        graduationYear: p.education.graduationYear
      }
    });

    await prisma.profileCareer.create({
      data: {
        profileId: profile.id,
        profession: p.career.profession,
        employer: p.career.employer,
        designation: p.career.designation,
        annualIncome: p.career.annualIncome,
        workLocation: p.career.workLocation
      }
    });

    await prisma.profileFamily.create({
      data: {
        profileId: profile.id,
        fatherName: p.family.fatherName,
        motherName: p.family.motherName,
        fatherOccupation: p.family.fatherOccupation,
        motherOccupation: p.family.motherOccupation,
        familyType: p.family.familyType,
        familyValues: p.family.familyValues,
        siblingsCount: p.family.siblingsCount
      }
    });

    await prisma.profileLifestyle.create({
      data: {
        profileId: profile.id,
        foodHabit: p.lifestyle.foodHabit,
        smoking: p.lifestyle.smoking,
        drinking: p.lifestyle.drinking,
        fitnessLevel: p.lifestyle.fitnessLevel,
        hobbies: p.lifestyle.hobbies
      }
    });

    await prisma.profilePreference.create({
      data: {
        profileId: profile.id,
        minAge: p.preferences.minAge,
        maxAge: p.preferences.maxAge,
        minHeight: p.preferences.minHeight,
        maxHeight: p.preferences.maxHeight,
        religion: p.preferences.religion,
        caste: p.preferences.caste,
        city: p.preferences.city,
        education: p.preferences.education,
        profession: p.preferences.profession,
        smokingPreference: p.preferences.smokingPreference,
        drinkingPreference: p.preferences.drinkingPreference,
        childrenPreference: p.preferences.childrenPreference,
        familySetupPreference: p.preferences.familySetupPreference,
        relocationPreference: p.preferences.relocationPreference
      }
    });

    // Documents
    await prisma.profileDocument.create({
      data: {
        profileId: profile.id,
        fileUrl: `http://localhost:5000/uploads/document_biodata_${p.firstName.toLowerCase()}.pdf`,
        documentType: "BIODATA",
        approvalStatus: "APPROVED"
      }
    });

    // Photos
    await prisma.profilePhoto.create({
      data: {
        profileId: profile.id,
        cloudinaryUrl: `http://localhost:5000/uploads/photo_${p.firstName.toLowerCase()}_primary.jpg`,
        isPrimary: true,
        approvalStatus: "APPROVED"
      }
    });

    // Populate answers dynamically matching MCQ texts
    const answeredQuestionIds = new Set<string>();
    for (const [key, answerVal] of Object.entries(p.answers)) {
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

      if (answeredQuestionIds.has(targetQ.id)) {
        continue;
      }
      answeredQuestionIds.add(targetQ.id);

      let selectedOptionId = "";
      let importance: any = "MUST_HAVE";

      if (typeof answerVal === "object") {
        // MCQ question
        const valObj = answerVal as { option: string; importance: string };
        importance = valObj.importance === "PREFERRED" ? "NICE_TO_HAVE" : valObj.importance;
        
        // Find matching option
        const targetOpt = targetQ.options.find(o => o.optionText.toLowerCase().includes(valObj.option.toLowerCase()));
        selectedOptionId = targetOpt?.id || targetQ.options[0]?.id || "";
      } else {
        // Text question
        const textVal = answerVal as string;
        const existingOpt = targetQ.options.find(o => o.optionText === textVal);
        if (existingOpt) {
          selectedOptionId = existingOpt.id;
        } else {
          const newOpt = await prisma.questionOption.create({
            data: {
              questionId: targetQ.id,
              optionText: textVal
            }
          });
          targetQ.options.push(newOpt);
          selectedOptionId = newOpt.id;
        }
        importance = "MUST_HAVE";
      }

      if (selectedOptionId) {
        await prisma.profileAnswer.create({
          data: {
            profileId: profile.id,
            questionId: targetQ.id,
            selectedOptionId,
            importance
          }
        });
      }
    }

    console.log(`Seeded Reddy profile successfully: ${p.firstName} ${p.lastName} (${profile.profileNumber})`);
  }

  console.log("Reddy matrimonial profiles seeding finished!");
}

run().catch(console.error).finally(() => prisma.$disconnect());
