import { prisma } from '../src/config/prisma.js';
import { ProposalService } from '../src/modules/proposal/proposal.service.js';

async function run() {
  const service = new ProposalService();
  console.log("Starting Duplicate Proposal Prevention verification...");

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
        name: "Test Receiver Agency",
        email: `receiver-proposal-${Date.now()}@example.com`,
        mobile: "1234567890",
        city: "TestCity",
        state: "TestState",
        country: "TestCountry",
        agencyCode: `TEST-AGR-${Date.now()}`
      }
    });
    createdAgencyB = true;
  }

  // Find or mock a user ID for A
  const userA = await prisma.agencyUser.findFirst({ where: { agencyId: agencyA.id } });
  const mockUserId = userA?.id || "mock-user-id";

  let brideId: string | null = null;
  let groomId: string | null = null;
  let personBrideId: string | null = null;
  let personGroomId: string | null = null;
  let proposal1Id: string | null = null;
  let proposal2Id: string | null = null;

  try {
    // Create profiles
    const personBride = await prisma.person.create({ data: { firstName: "TestBride", gender: "FEMALE" } });
    personBrideId = personBride.id;

    const bride = await prisma.agencyProfile.create({
      data: {
        agencyId: agencyA.id,
        personId: personBride.id,
        profileNumber: `TEST-PROP-B-${Date.now()}`,
        profileType: "BRIDE",
        status: "ACTIVE"
      }
    });
    brideId = bride.id;

    const personGroom = await prisma.person.create({ data: { firstName: "TestGroom", gender: "MALE" } });
    personGroomId = personGroom.id;

    const groom = await prisma.agencyProfile.create({
      data: {
        agencyId: agencyB.id,
        personId: personGroom.id,
        profileNumber: `TEST-PROP-G-${Date.now()}`,
        profileType: "GROOM",
        status: "ACTIVE"
      }
    });
    groomId = groom.id;

    // 1. Create first proposal => Should succeed
    console.log("\nCase 1: Creating initial proposal between bride and groom...");
    const proposal1 = await service.createProposal({
      receiverAgencyId: agencyB.id,
      brideProfileId: bride.id,
      groomProfileId: groom.id
    }, agencyA.id, mockUserId);
    proposal1Id = proposal1.id;
    console.log(`PASS: Initial proposal created successfully with ID: ${proposal1.id}`);

    // 2. Try creating second proposal while first is active ("SENT") => Should fail
    try {
      console.log("\nCase 2: Creating duplicate proposal while initial is active...");
      await service.createProposal({
        receiverAgencyId: agencyB.id,
        brideProfileId: bride.id,
        groomProfileId: groom.id
      }, agencyA.id, mockUserId);
      console.log("FAIL: Created duplicate proposal when active proposal existed.");
    } catch (error: any) {
      if (error.message.includes("active proposal already exists")) {
        console.log(`PASS: Rejected with expected error: "${error.message}"`);
      } else {
        console.log(`FAIL: Rejected with unexpected error: "${error.message}"`);
      }
    }

    // 3. Mark proposal as REJECTED
    console.log("\nUpdating proposal status to REJECTED...");
    await prisma.proposal.update({
      where: { id: proposal1.id },
      data: { proposalStatus: "REJECTED" }
    });

    // 4. Try creating second proposal now => Should succeed
    try {
      console.log("\nCase 3: Creating proposal when previous was REJECTED...");
      const proposal2 = await service.createProposal({
        receiverAgencyId: agencyB.id,
        brideProfileId: bride.id,
        groomProfileId: groom.id
      }, agencyA.id, mockUserId);
      proposal2Id = proposal2.id;
      console.log(`PASS: Proposal created successfully after rejection with ID: ${proposal2.id}`);
    } catch (error: any) {
      console.log(`FAIL: Could not create proposal after rejection. Error: ${error.message}`);
    }

  } finally {
    console.log("\nStarting robust cleanup of test records...");
    
    // Delete Proposal Activities
    try {
      const pIds = [proposal1Id, proposal2Id].filter(Boolean) as string[];
      if (pIds.length > 0) {
        await prisma.proposalActivity.deleteMany({ where: { proposalId: { in: pIds } } });
      }
    } catch (e: any) {
      console.error("Failed to delete proposal activities:", e.message);
    }

    // Delete Proposals
    try {
      if (proposal2Id) await prisma.proposal.delete({ where: { id: proposal2Id } });
    } catch (e: any) {
      console.error("Failed to delete proposal 2:", e.message);
    }
    try {
      if (proposal1Id) await prisma.proposal.delete({ where: { id: proposal1Id } });
    } catch (e: any) {
      console.error("Failed to delete proposal 1:", e.message);
    }

    // Delete Profiles
    try {
      const prIds = [brideId, groomId].filter(Boolean) as string[];
      if (prIds.length > 0) {
        await prisma.agencyProfile.deleteMany({ where: { id: { in: prIds } } });
      }
    } catch (e: any) {
      console.error("Failed to delete profiles:", e.message);
    }

    // Delete Persons
    try {
      const peIds = [personBrideId, personGroomId].filter(Boolean) as string[];
      if (peIds.length > 0) {
        await prisma.person.deleteMany({ where: { id: { in: peIds } } });
      }
    } catch (e: any) {
      console.error("Failed to delete persons:", e.message);
    }

    // Delete dynamic agency
    if (createdAgencyB) {
      try {
        console.log("Cleaning up receiver agency...");
        await prisma.agency.delete({ where: { id: agencyB.id } });
      } catch (e: any) {
        console.error("Failed to delete receiver agency:", e.message);
      }
    }
  }
}

run().catch(console.error);
