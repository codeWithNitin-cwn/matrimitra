import { prisma } from '../src/config/prisma.js';
import { FollowUpService } from '../src/modules/followup/followup.service.js';

async function run() {
  const service = new FollowUpService();
  console.log("Starting Follow-Up Authorization verification...");

  // Find two separate agencies
  let agencies = await prisma.agency.findMany({ take: 2 });
  let createdAgencyB = false;
  let agencyA = agencies[0];
  let agencyB = agencies[1];

  if (!agencyA) {
    console.error("No agencies exist in the database. Please seed first.");
    process.exit(1);
  }

  if (!agencyB) {
    console.log("Only 1 agency found. Dynamically creating a secondary agency for testing...");
    agencyB = await prisma.agency.create({
      data: {
        name: "Test Forbidden Agency",
        email: `forbidden-followup-${Date.now()}@example.com`,
        mobile: "1234567890",
        city: "TestCity",
        state: "TestState",
        country: "TestCountry",
        agencyCode: `TEST-AGF-${Date.now()}`
      }
    });
    createdAgencyB = true;
  }

  // Find users for the agencies (or mock a user ID)
  const userA = await prisma.agencyUser.findFirst({ where: { agencyId: agencyA.id } });
  const mockUserId = userA?.id || "mock-user-id";

  console.log(`Agency A (Authorized): ${agencyA.name} (${agencyA.id})`);
  console.log(`Agency B (Forbidden): ${agencyB.name} (${agencyB.id})`);

  try {
    // 1. Create a profile belonging to Agency A
    const personA = await prisma.person.create({ data: { firstName: "ClientA", gender: "FEMALE" } });
    const profileA = await prisma.agencyProfile.create({
      data: {
        agencyId: agencyA.id,
        personId: personA.id,
        profileNumber: `TEST-FL-A-${Date.now()}`,
        profileType: "BRIDE",
        status: "ACTIVE"
      }
    });

    // 2. Create a profile belonging to Agency B
    const personB = await prisma.person.create({ data: { firstName: "ClientB", gender: "MALE" } });
    const profileB = await prisma.agencyProfile.create({
      data: {
        agencyId: agencyB.id,
        personId: personB.id,
        profileNumber: `TEST-FL-B-${Date.now()}`,
        profileType: "GROOM",
        status: "ACTIVE"
      }
    });

    // Case 1: Create follow-up for own profile => Should PASS
    try {
      console.log("\nCase 1: Creating follow-up for own profile (Agency A)...");
      const followUp = await service.createFollowUp({
        profileId: profileA.id,
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        priority: "MEDIUM",
        notes: "Test notes",
        assignedUserId: mockUserId
      }, agencyA.id);
      console.log(`PASS: Follow-up created successfully with ID: ${followUp.id}`);
      // Clean up the created follow-up
      await prisma.followUp.delete({ where: { id: followUp.id } });
    } catch (error: any) {
      console.log(`FAIL: Could not create follow-up for own profile. Error: ${error.message}`);
    }

    // Case 2: Create follow-up for foreign profile (Agency B) => Should FAIL (403/Unauthorized)
    try {
      console.log("\nCase 2: Creating follow-up for foreign profile (Agency B)...");
      await service.createFollowUp({
        profileId: profileB.id,
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        priority: "MEDIUM",
        notes: "Should fail notes",
        assignedUserId: mockUserId
      }, agencyA.id);
      console.log("FAIL: Successfully created follow-up for another agency's profile.");
    } catch (error: any) {
      if (error.message.includes("Unauthorized")) {
        console.log(`PASS: Rejected with expected error: "${error.message}"`);
      } else {
        console.log(`FAIL: Rejected with unexpected error: "${error.message}"`);
      }
    }

    // Case 3: Create follow-up with unrelated proposal => Should FAIL (403/Unauthorized)
    // Create proposal between Agency B and Agency B (or self) where Agency A is not a party
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const proposalB = await prisma.proposal.create({
      data: {
        proposalNumber: `PROP-FL-${randomNum}`,
        senderAgencyId: agencyB.id,
        receiverAgencyId: agencyB.id,
        brideProfileId: profileA.id, // linked to bride (owned by A) for simplicity of test, but proposal is owned by B
        groomProfileId: profileB.id,
        proposalStatus: "ACCEPTED",
        createdBy: "SYSTEM"
      }
    });

    try {
      console.log("\nCase 3: Creating follow-up with foreign proposal...");
      await service.createFollowUp({
        profileId: profileA.id,
        proposalId: proposalB.id,
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        priority: "HIGH",
        notes: "Should fail with proposal check",
        assignedUserId: mockUserId
      }, agencyA.id);
      console.log("FAIL: Successfully created follow-up using a proposal from another agency.");
    } catch (error: any) {
      if (error.message.includes("Unauthorized")) {
        console.log(`PASS: Rejected with expected error: "${error.message}"`);
      } else {
        console.log(`FAIL: Rejected with unexpected error: "${error.message}"`);
      }
    }

    // Clean up temporary records
    await prisma.proposal.delete({ where: { id: proposalB.id } });
    await prisma.agencyProfile.deleteMany({ where: { id: { in: [profileA.id, profileB.id] } } });
    await prisma.person.deleteMany({ where: { id: { in: [personA.id, personB.id] } } });

  } finally {
    if (createdAgencyB) {
      console.log("\nCleaning up dynamic secondary agency...");
      await prisma.agency.delete({ where: { id: agencyB.id } });
    }
  }
}

run().catch(console.error);
