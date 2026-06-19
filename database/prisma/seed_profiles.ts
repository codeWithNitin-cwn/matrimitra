import { prisma } from "../../backend/src/config/prisma.js";
import crypto from "crypto";

async function run() {
  console.log("Starting matrimonial profiles seeding...");

  // 1. Get default agency and user
  const agency = await prisma.agency.findFirst();
  if (!agency) {
    console.error("No agency found. Please run seed_questions first or ensure an agency exists.");
    process.exit(1);
  }

  const agencyUser = await prisma.agencyUser.findFirst({
    where: { agencyId: agency.id }
  });
  const assignedUserId = agencyUser?.id || null;

  console.log(`Using Agency: ${agency.name} (${agency.id})`);
  console.log(`Assigned User: ${agencyUser?.username || 'None'}`);

  // Fetch all questions and options to map answers dynamically
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
      // Profile 1: Priya Sharma (Bride)
      firstName: "Priya",
      lastName: "Sharma",
      gender: "FEMALE",
      dob: new Date("1998-05-14"),
      relationshipToClient: "DAUGHTER",
      clientMobile: "9876543210",
      clientEmail: "ramesh.sharma@example.com",
      clientAddress: "12, Shanti Kunj, Sector 15, Dwarka, New Delhi",
      clientFirstName: "Ramesh",
      clientLastName: "Sharma",
      
      personal: {
        religion: "Hindu",
        caste: "Brahmin",
        subCaste: "Saraswat",
        motherTongue: "Hindi",
        heightCm: 162,
        weightKg: 54,
        maritalStatus: "NEVER_MARRIED",
        state: "Delhi",
        country: "India",
        city: "New Delhi"
      },
      education: {
        degree: "M.Tech",
        specialization: "Computer Science & Artificial Intelligence",
        institution: "IIT Delhi",
        graduationYear: 2021
      },
      career: {
        profession: "Software Engineer",
        employer: "Google India",
        designation: "Senior Software Engineer",
        annualIncome: 3200000,
        workLocation: "Gurugram"
      },
      family: {
        fatherName: "Ramesh Sharma",
        motherName: "Sushma Sharma",
        fatherOccupation: "Retired Senior Govt Officer",
        motherOccupation: "Homemaker",
        familyType: "Nuclear",
        familyValues: "Liberal",
        siblingsCount: 1,
        siblingsDetails: "One younger brother studying B.Tech at BITS Pilani."
      },
      lifestyle: {
        foodHabit: "Vegetarian",
        smoking: false,
        drinking: false,
        fitnessLevel: "Active",
        hobbies: ["Classical music", "Photography", "Gardening", "Hiking"]
      },
      preferences: {
        minAge: 27,
        maxAge: 32,
        minHeight: 172,
        maxHeight: 188,
        religion: "Hindu",
        caste: "Brahmin",
        city: "Delhi NCR, Mumbai, Bengaluru",
        education: "Post Graduate / B.Tech / MBA from premier institutes",
        profession: "Software Engineer, Product Manager, Business Consultant, Officer",
        smokingPreference: false,
        drinkingPreference: false,
        childrenPreference: "Wants children",
        familySetupPreference: "Flexible",
        relocationPreference: "Open to relocate"
      },
      answers: {
        "disagreements": { option: "Discuss immediately", importance: "MUST_HAVE" },
        "daily communication": { option: "Extremely important", importance: "PREFERRED" },
        "stressed": { option: "Emotional support", importance: "NICE_TO_HAVE" },
        "spouse": { option: "Respect", importance: "MUST_HAVE" },
        "why": { option: "Companionship", importance: "PREFERRED" },
        "setup": { option: "Nuclear family", importance: "MUST_HAVE" },
        "parents": { option: "Moderately involved", importance: "PREFERRED" },
        " conflicts": { option: "Balance both", importance: "MUST_HAVE" },
        "traditions": { option: "Neutral", importance: "NICE_TO_HAVE" },
        "children": { option: "Yes", importance: "MUST_HAVE" },
        "timeline": { option: "1-2 years", importance: "NICE_TO_HAVE" },
        "parenting": { option: "Balanced", importance: "PREFERRED" },
        "responsibility": { option: "Both equally", importance: "MUST_HAVE" },
        "work": { option: "Yes", importance: "MUST_HAVE" },
        "relocate": { option: "Yes", importance: "PREFERRED" },
        "growth": { option: "Extremely important", importance: "MUST_HAVE" },
        "lifestyle": { option: "Balanced", importance: "MUST_HAVE" },
        "spending": { option: "Balanced", importance: "PREFERRED" },
        "jointly": { option: "Yes", importance: "MUST_HAVE" },
        "planning": { option: "Very important", importance: "MUST_HAVE" },
        "goal": { option: "Comfortable life", importance: "PREFERRED" },
        "food": { option: "Vegetarian", importance: "MUST_HAVE" },
        "smoking habit": { option: "Never", importance: "MUST_HAVE" },
        "drinking habit": { option: "Never", importance: "MUST_HAVE" },
        "weekend": { option: "Family", importance: "PREFERRED" },
        "fitness": { option: "Important", importance: "NICE_TO_HAVE" },
        "best": { option: "Ambivert", importance: "DOESNT_MATTER" },
        "decisions": { option: "Both", importance: "PREFERRED" },
        "adventurous": { option: "Moderately adventurous", importance: "NICE_TO_HAVE" },
        "personal space": { option: "Very important", importance: "MUST_HAVE" },
        "settle": { option: "Flexible", importance: "PREFERRED" },
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
      }
    },
    {
      // Profile 2: Nikhila Rao (Bride)
      firstName: "Nikhila",
      lastName: "Rao",
      gender: "FEMALE",
      dob: new Date("1996-11-22"),
      relationshipToClient: "SELF",
      clientMobile: "9812345678",
      clientEmail: "nikhila.rao@example.com",
      clientAddress: "Flat 405, Block B, Mantri Altius, Jayanagar, Bengaluru",
      clientFirstName: "Nikhila",
      clientLastName: "Rao",
      
      personal: {
        religion: "Hindu",
        caste: "Brahmin",
        subCaste: "Smartha",
        motherTongue: "Kannada",
        heightCm: 165,
        weightKg: 58,
        maritalStatus: "NEVER_MARRIED",
        state: "Karnataka",
        country: "India",
        city: "Bengaluru"
      },
      education: {
        degree: "MBA",
        specialization: "Finance",
        institution: "IIM Bangalore",
        graduationYear: 2019
      },
      career: {
        profession: "Investment Banker",
        employer: "Goldman Sachs",
        designation: "Vice President",
        annualIncome: 4500000,
        workLocation: "Bengaluru"
      },
      family: {
        fatherName: "Ananth Rao",
        motherName: "Radha Rao",
        fatherOccupation: "Professor of Economics",
        motherOccupation: "Classical Dancer & Tutor",
        familyType: "Nuclear",
        familyValues: "Traditional",
        siblingsCount: 0,
        siblingsDetails: "Single child."
      },
      lifestyle: {
        foodHabit: "Vegetarian",
        smoking: false,
        drinking: false,
        fitnessLevel: "Yoga enthusiast",
        hobbies: ["Carnatic vocal music", "Reading literature", "Yoga", "Cooking authentic south Indian cuisine"]
      },
      preferences: {
        minAge: 29,
        maxAge: 34,
        minHeight: 175,
        maxHeight: 190,
        religion: "Hindu",
        caste: "Brahmin",
        city: "Bengaluru, Chennai, Hyderabad",
        education: "MBA, MS, MD, or B.Tech from tier-1 institutions",
        profession: "Corporate Professionals, Entrepreneurs, Bankers",
        smokingPreference: false,
        drinkingPreference: false,
        childrenPreference: "Wants children",
        familySetupPreference: "Flexible",
        relocationPreference: "Prefer Bengaluru"
      },
      answers: {
        "disagreements": { option: "Take time and discuss later", importance: "PREFERRED" },
        "daily communication": { option: "Important", importance: "PREFERRED" },
        "stressed": { option: "Space and independence", importance: "PREFERRED" },
        "spouse": { option: "Trust", importance: "MUST_HAVE" },
        "why": { option: "Shared life goals", importance: "MUST_HAVE" },
        "setup": { option: "Either", importance: "NICE_TO_HAVE" },
        "parents": { option: "Highly involved", importance: "MUST_HAVE" },
        " conflicts": { option: "Family first", importance: "PREFERRED" },
        "traditions": { option: "Very important", importance: "MUST_HAVE" },
        "children": { option: "Yes", importance: "MUST_HAVE" },
        "timeline": { option: "1-2 years", importance: "PREFERRED" },
        "parenting": { option: "Strict", importance: "NICE_TO_HAVE" },
        "responsibility": { option: "Both equally", importance: "PREFERRED" },
        "work": { option: "Yes", importance: "MUST_HAVE" },
        "relocate": { option: "Depends", importance: "MUST_HAVE" },
        "growth": { option: "Important", importance: "PREFERRED" },
        "lifestyle": { option: "Family focused", importance: "NICE_TO_HAVE" },
        "spending": { option: "Saver", importance: "MUST_HAVE" },
        "jointly": { option: "Yes", importance: "PREFERRED" },
        "planning": { option: "Very important", importance: "MUST_HAVE" },
        "goal": { option: "Comfortable life", importance: "PREFERRED" },
        "food": { option: "Vegetarian", importance: "MUST_HAVE" },
        "smoking habit": { option: "Never", importance: "MUST_HAVE" },
        "drinking habit": { option: "Never", importance: "MUST_HAVE" },
        "weekend": { option: "Home", importance: "PREFERRED" },
        "fitness": { option: "Very important", importance: "PREFERRED" },
        "best": { option: "Introvert", importance: "DOESNT_MATTER" },
        "decisions": { option: "Logic", importance: "MUST_HAVE" },
        "adventurous": { option: "Conservative", importance: "NICE_TO_HAVE" },
        "personal space": { option: "Important", importance: "PREFERRED" },
        "settle": { option: "Current city", importance: "MUST_HAVE" },
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
      }
    },
    {
      // Profile 3: Arjun Sharma (Groom)
      firstName: "Arjun",
      lastName: "Sharma",
      gender: "MALE",
      dob: new Date("1993-08-25"),
      relationshipToClient: "SON",
      clientMobile: "9988776655",
      clientEmail: "vijay.sharma@example.com",
      clientAddress: "45A, Sunder Nagar, Near Zoo, Jaipur, Rajasthan",
      clientFirstName: "Vijay",
      clientLastName: "Sharma",
      
      personal: {
        religion: "Hindu",
        caste: "Brahmin",
        subCaste: "Kanyakubja",
        motherTongue: "Hindi",
        heightCm: 178,
        weightKg: 75,
        maritalStatus: "NEVER_MARRIED",
        state: "Rajasthan",
        country: "India",
        city: "Jaipur"
      },
      education: {
        degree: "MBA",
        specialization: "Finance & Strategy",
        institution: "FMS Delhi",
        graduationYear: 2017
      },
      career: {
        profession: "Corporate Strategy Manager",
        employer: "Adani Group",
        designation: "Strategy Director",
        annualIncome: 3800000,
        workLocation: "Ahmedabad"
      },
      family: {
        fatherName: "Vijay Sharma",
        motherName: "Kiran Sharma",
        fatherOccupation: "Retired Principal",
        motherOccupation: "Retired School Teacher",
        familyType: "Joint",
        familyValues: "Moderate",
        siblingsCount: 2,
        siblingsDetails: "One elder sister (married, settled in UK), one younger brother (B.Arch, working in Delhi)."
      },
      lifestyle: {
        foodHabit: "Vegetarian",
        smoking: false,
        drinking: false,
        fitnessLevel: "Gym regular",
        hobbies: ["Squash", "Reading history", "Stock trading", "Watching documentaries"]
      },
      preferences: {
        minAge: 25,
        maxAge: 30,
        minHeight: 157,
        maxHeight: 172,
        religion: "Hindu",
        caste: "Brahmin",
        city: "Delhi, Rajasthan, Gujarat, Mumbai",
        education: "Bachelor's / Master's degree from reputed university",
        profession: "Working professional (IT, Finance, HR, Creative) or open to home manager",
        smokingPreference: false,
        drinkingPreference: false,
        childrenPreference: "Wants children",
        familySetupPreference: "Nuclear or Joint",
        relocationPreference: "Open to relocate to Ahmedabad"
      },
      answers: {
        "disagreements": { option: "Discuss immediately", importance: "PREFERRED" },
        "daily communication": { option: "Important", importance: "PREFERRED" },
        "stressed": { option: "Practical solutions", importance: "PREFERRED" },
        "spouse": { option: "Trust", importance: "MUST_HAVE" },
        "why": { option: "Companionship", importance: "PREFERRED" },
        "setup": { option: "Nuclear family", importance: "PREFERRED" },
        "parents": { option: "Moderately involved", importance: "PREFERRED" },
        " conflicts": { option: "Balance both", importance: "MUST_HAVE" },
        "traditions": { option: "Important", importance: "NICE_TO_HAVE" },
        "children": { option: "Yes", importance: "MUST_HAVE" },
        "timeline": { option: "3-5 years", importance: "NICE_TO_HAVE" },
        "parenting": { option: "Balanced", importance: "PREFERRED" },
        "responsibility": { option: "Both equally", importance: "MUST_HAVE" },
        "work": { option: "Yes", importance: "MUST_HAVE" },
        "relocate": { option: "Yes", importance: "PREFERRED" },
        "growth": { option: "Important", importance: "PREFERRED" },
        "lifestyle": { option: "Balanced", importance: "MUST_HAVE" },
        "spending": { option: "Saver", importance: "MUST_HAVE" },
        "jointly": { option: "Partially", importance: "NICE_TO_HAVE" },
        "planning": { option: "Very important", importance: "MUST_HAVE" },
        "goal": { option: "Wealth creation", importance: "PREFERRED" },
        "food": { option: "Vegetarian", importance: "MUST_HAVE" },
        "smoking habit": { option: "Never", importance: "MUST_HAVE" },
        "drinking habit": { option: "Never", importance: "MUST_HAVE" },
        "weekend": { option: "Social gatherings", importance: "PREFERRED" },
        "fitness": { option: "Important", importance: "NICE_TO_HAVE" },
        "best": { option: "Ambivert", importance: "DOESNT_MATTER" },
        "decisions": { option: "Both", importance: "PREFERRED" },
        "adventurous": { option: "Moderately adventurous", importance: "NICE_TO_HAVE" },
        "personal space": { option: "Important", importance: "PREFERRED" },
        "settle": { option: "Flexible", importance: "PREFERRED" },
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
      }
    },
    {
      // Profile 4: Rohit Iyer (Groom)
      firstName: "Rohit",
      lastName: "Iyer",
      gender: "MALE",
      dob: new Date("1991-03-30"),
      relationshipToClient: "SELF",
      clientMobile: "9845012345",
      clientEmail: "rohit.iyer@example.com",
      clientAddress: "S3, Third Floor, Iyer Enclave, Mylapore, Chennai",
      clientFirstName: "Rohit",
      clientLastName: "Iyer",
      
      personal: {
        religion: "Hindu",
        caste: "Brahmin",
        subCaste: "Vadama",
        motherTongue: "Tamil",
        heightCm: 180,
        weightKg: 78,
        maritalStatus: "NEVER_MARRIED",
        state: "Tamil Nadu",
        country: "India",
        city: "Chennai"
      },
      education: {
        degree: "M.S.",
        specialization: "Data Science & Statistics",
        institution: "Carnegie Mellon University, USA",
        graduationYear: 2015
      },
      career: {
        profession: "Director of Data Science",
        employer: "Amazon",
        designation: "Director of Machine Learning",
        annualIncome: 5500000,
        workLocation: "Chennai"
      },
      family: {
        fatherName: "K. Subramanian Iyer",
        motherName: "Savitri Iyer",
        fatherOccupation: "Retired Chief Manager, SBI",
        motherOccupation: "Sanskrit Scholar & Tutor",
        familyType: "Nuclear",
        familyValues: "Liberal",
        siblingsCount: 1,
        siblingsDetails: "One younger sister married and settled in Seattle, USA."
      },
      lifestyle: {
        foodHabit: "Vegetarian",
        smoking: false,
        drinking: false,
        fitnessLevel: "Regular Runner",
        hobbies: ["Carnatic Violinist", "Astronomy", "Traveling", "Volunteering at heritage trusts"]
      },
      preferences: {
        minAge: 27,
        maxAge: 32,
        minHeight: 160,
        maxHeight: 175,
        religion: "Hindu",
        caste: "Brahmin",
        city: "Chennai, Bengaluru, USA (willing to relocate)",
        education: "Master's / MBA / PhD from premier institutes",
        profession: "Corporate Professionals, Tech Leaders, Academic Scholars",
        smokingPreference: false,
        drinkingPreference: false,
        childrenPreference: "Wants children",
        familySetupPreference: "Nuclear",
        relocationPreference: "Open to USA or Chennai/Bengaluru"
      },
      answers: {
        "disagreements": { option: "Discuss immediately", importance: "MUST_HAVE" },
        "daily communication": { option: "Extremely important", importance: "PREFERRED" },
        "stressed": { option: "Depends on situation", importance: "PREFERRED" },
        "spouse": { option: "Trust", importance: "MUST_HAVE" },
        "why": { option: "Emotional connection", importance: "MUST_HAVE" },
        "setup": { option: "Nuclear family", importance: "MUST_HAVE" },
        "parents": { option: "Moderately involved", importance: "PREFERRED" },
        " conflicts": { option: "Balance both", importance: "MUST_HAVE" },
        "traditions": { option: "Neutral", importance: "NICE_TO_HAVE" },
        "children": { option: "Yes", importance: "MUST_HAVE" },
        "timeline": { option: "1-2 years", importance: "NICE_TO_HAVE" },
        "parenting": { option: "Balanced", importance: "PREFERRED" },
        "responsibility": { option: "Both equally", importance: "MUST_HAVE" },
        "work": { option: "Yes", importance: "MUST_HAVE" },
        "relocate": { option: "Yes", importance: "PREFERRED" },
        "growth": { option: "Extremely important", importance: "MUST_HAVE" },
        "lifestyle": { option: "Balanced", importance: "MUST_HAVE" },
        "spending": { option: "Balanced", importance: "PREFERRED" },
        "jointly": { option: "Yes", importance: "MUST_HAVE" },
        "planning": { option: "Very important", importance: "MUST_HAVE" },
        "goal": { option: "Wealth creation", importance: "PREFERRED" },
        "food": { option: "Vegetarian", importance: "MUST_HAVE" },
        "smoking habit": { option: "Never", importance: "MUST_HAVE" },
        "drinking habit": { option: "Never", importance: "MUST_HAVE" },
        "weekend": { option: "Travel", importance: "PREFERRED" },
        "fitness": { option: "Important", importance: "NICE_TO_HAVE" },
        "best": { option: "Ambivert", importance: "DOESNT_MATTER" },
        "decisions": { option: "Both", importance: "PREFERRED" },
        "adventurous": { option: "Very adventurous", importance: "NICE_TO_HAVE" },
        "personal space": { option: "Very important", importance: "MUST_HAVE" },
        "settle": { option: "Flexible", importance: "PREFERRED" },
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
        status: "ACTIVE", // Start as ACTIVE for matching
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
        console.warn(`Duplicate match for key "${key}" matching question ID ${targetQ.id}. Skipping.`);
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

    console.log(`Seeded profile successfully: ${p.firstName} ${p.lastName} (${profile.profileNumber})`);
  }

  console.log("matrimonial profiles seeding finished!");
}

run().catch(console.error);
