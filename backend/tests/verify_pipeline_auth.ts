import { prisma } from '../src/config/prisma.js';
import { PipelineService } from '../src/modules/pipeline/pipeline.service.js';

async function run() {
  const service = new PipelineService();
  console.log("Starting Pipeline Authorization verification...");

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
        email: `forbidden-${Date.now()}@example.com`,
        mobile: "1234567890",
        city: "TestCity",
        state: "TestState",
        country: "TestCountry",
        agencyCode: `TEST-AG-${Date.now()}`
      }
    });
    createdAgencyB = true;
  }

  console.log(`Agency A (Authorized): ${agencyA.name} (${agencyA.id})`);
  console.log(`Agency B (Forbidden): ${agencyB.name} (${agencyB.id})`);

  try {
    // Let's create dummy profiles
    const person1 = await prisma.person.create({ data: { firstName: "Bride", gender: "FEMALE" } });
    const person2 = await prisma.person.create({ data: { firstName: "Groom", gender: "MALE" } });

    const bride = await prisma.agencyProfile.create({
      data: {
        agencyId: agencyA.id,
        personId: person1.id,
        profileNumber: `TEST-B-${Date.now()}`,
        profileType: "BRIDE",
        status: "ACTIVE"
      }
    });

    const groom = await prisma.agencyProfile.create({
      data: {
        agencyId: agencyA.id,
        personId: person2.id,
        profileNumber: `TEST-G-${Date.now()}`,
        profileType: "GROOM",
        status: "ACTIVE"
      }
    });

    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const proposal = await prisma.proposal.create({
      data: {
        proposalNumber: `PROP-${randomNum}`,
        senderAgencyId: agencyA.id,
        receiverAgencyId: agencyA.id, // self proposal for simplicity
        brideProfileId: bride.id,
        groomProfileId: groom.id,
        proposalStatus: "ACCEPTED",
        brideAccepted: true,
        groomAccepted: true,
        createdBy: "SYSTEM"
      }
    });

    const pipeline = await prisma.pipeline.create({
      data: {
        proposalId: proposal.id,
        currentStage: "PROPOSAL_SENT",
        updatedBy: "SYSTEM"
      }
    });

    console.log(`Created test proposal ID: ${proposal.id} and pipeline ID: ${pipeline.id}`);

    // Verify access
    await testAccess(proposal.id, agencyA.id, agencyB.id);

    // Clean up test records
    await prisma.pipelineHistory.deleteMany({ where: { pipelineId: pipeline.id } });
    await prisma.pipeline.delete({ where: { id: pipeline.id } });
    await prisma.proposal.delete({ where: { id: proposal.id } });
    await prisma.agencyProfile.deleteMany({ where: { id: { in: [bride.id, groom.id] } } });
    await prisma.person.deleteMany({ where: { id: { in: [person1.id, person2.id] } } });

  } finally {
    if (createdAgencyB) {
      console.log("Cleaning up dynamic secondary agency...");
      await prisma.agency.delete({ where: { id: agencyB.id } });
    }
  }
}

async function testAccess(proposalId: string, allowedAgencyId: string, forbiddenAgencyId: string) {
  const service = new PipelineService();

  // Scenario 1: Allowed Agency accesses the pipeline
  try {
    console.log(`\nScenario 1: Authorized agency (${allowedAgencyId}) querying pipeline...`);
    const pipeline = await service.getPipeline(proposalId, allowedAgencyId);
    console.log(`PASS: Authorized agency successfully fetched pipeline stage: ${pipeline.currentStage}`);
  } catch (error: any) {
    console.log(`FAIL: Authorized agency should have been allowed access. Error: ${error.message}`);
  }

  // Scenario 2: Unrelated Agency accesses the pipeline
  try {
    console.log(`\nScenario 2: Unrelated agency (${forbiddenAgencyId}) querying pipeline...`);
    await service.getPipeline(proposalId, forbiddenAgencyId);
    console.log("FAIL: Unrelated agency was allowed to view the pipeline.");
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      console.log(`PASS: Unrelated agency was rejected with expected error: "${error.message}"`);
    } else {
      console.log(`FAIL: Rejected with unexpected error: "${error.message}"`);
    }
  }
}

run().catch(console.error);
