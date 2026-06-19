import { prisma } from "../../backend/src/config/prisma.js";

async function verify() {
  console.log("Starting verification for Reddy Matrimony...");

  const agency = await prisma.agency.findFirst({
    where: { name: "Reddy Matrimony" }
  });
  if (!agency) {
    throw new Error("Reddy Matrimony agency not found");
  }

  // 1. Clients check
  const clients = await prisma.client.findMany({
    where: { agencyId: agency.id }
  });
  console.log(`Clients count under Reddy Matrimony: ${clients.length}`);
  if (clients.length !== 5) {
    throw new Error(`Expected 5 clients, got ${clients.length}`);
  }

  // 2. Active profiles check
  const profiles = await prisma.agencyProfile.findMany({
    where: { agencyId: agency.id, status: "ACTIVE" },
    include: {
      person: true,
      answers: {
        include: {
          selectedOption: true
        }
      }
    }
  });
  console.log(`ACTIVE profiles count under Reddy Matrimony: ${profiles.length}`);
  if (profiles.length !== 5) {
    throw new Error(`Expected 5 ACTIVE profiles, got ${profiles.length}`);
  }

  // 3. No TEXT_ANSWER values in LONG_TEXT questions
  let textAnswerCount = 0;
  for (const p of profiles) {
    for (const ans of p.answers) {
      if (ans.selectedOption.optionText === "TEXT_ANSWER") {
        console.error(`Error: Profile ${p.person.firstName} has a TEXT_ANSWER placeholder!`);
        textAnswerCount++;
      }
    }
  }

  if (textAnswerCount > 0) {
    throw new Error(`Found ${textAnswerCount} TEXT_ANSWER placeholders.`);
  }

  console.log("Verification PASSED!");
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
