import { prisma } from "../src/config/prisma.js";
import { ProposalService } from "../src/modules/proposal/proposal.service.js";

async function verify() {
  console.log("Verifying Internal (Same-Agency) Proposal Support...");
  const service = new ProposalService();

  // Find an agency
  const agency = await prisma.agency.findFirst();
  if (!agency) {
    console.error("No agency found.");
    process.exit(1);
  }

  // Find two active profiles belonging to this same agency
  const profiles = await prisma.agencyProfile.findMany({
    where: { agencyId: agency.id, status: "ACTIVE" },
    include: { person: true }
  });

  const bride = profiles.find(p => p.profileType === "BRIDE");
  const groom = profiles.find(p => p.profileType === "GROOM");

  if (!bride || !groom) {
    console.log("Not enough active same-agency profiles (need a BRIDE and GROOM). Skipping test.");
    return;
  }

  console.log(`Creating internal proposal between ${bride.person.firstName} and ${groom.person.firstName} under agency: ${agency.name}`);

  // Create mock user
  const user = await prisma.agencyUser.findFirst({ where: { agencyId: agency.id } });
  const mockUserId = user?.id || "mock-user-id";

  let proposalId: string | null = null;
  try {
    const proposal = await service.createProposal({
      receiverAgencyId: agency.id,
      brideProfileId: bride.id,
      groomProfileId: groom.id,
      proposalNotes: "Internal test proposal"
    }, agency.id, mockUserId);

    proposalId = proposal.id;
    console.log(`Proposal created successfully! ID: ${proposal.id}`);
    console.log(`matchType: ${proposal.matchType}`);

    if (proposal.matchType === "INTERNAL") {
      console.log("PASS: Proposal successfully identified as INTERNAL!");
    } else {
      console.error(`FAIL: Expected matchType INTERNAL, got ${proposal.matchType}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error("FAIL: Proposal creation threw an error:", error.message);
    process.exit(1);
  } finally {
    if (proposalId) {
      console.log("Cleaning up proposal...");
      await prisma.proposalActivity.deleteMany({ where: { proposalId } });
      await prisma.proposal.delete({ where: { id: proposalId } });
      console.log("Cleanup finished.");
    }
  }
}

verify().catch(console.error).finally(() => prisma.$disconnect());
