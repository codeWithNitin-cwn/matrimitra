import { prisma } from '../src/config/prisma.js';
import { ProfileService } from '../src/modules/profile/profile.service.js';

async function run() {
  const service = new ProfileService();
  console.log("Starting Profile Visibility verification...");

  // 1. Setup Agencies
  const agencyA = await prisma.agency.create({
    data: {
      name: "Agency A",
      email: `agency-a-${Date.now()}@example.com`,
      mobile: "1234567890",
      city: "CityA",
      state: "StateA",
      country: "CountryA",
      agencyCode: `TEST-AA-${Date.now()}`
    }
  });

  const agencyB = await prisma.agency.create({
    data: {
      name: "Agency B",
      email: `agency-b-${Date.now()}@example.com`,
      mobile: "0987654321",
      city: "CityB",
      state: "StateB",
      country: "CountryB",
      agencyCode: `TEST-AB-${Date.now()}`
    }
  });

  // Create an AgencyUser under Agency A to avoid ProfileAccessLog foreign key errors
  const agencyUserA = await prisma.agencyUser.create({
    data: {
      agencyId: agencyA.id,
      email: `agent-a-${Date.now()}@example.com`,
      username: `agentA_${Date.now()}`,
      mobile: "1234567890",
      firstName: "Agent",
      lastName: "A",
      passwordHash: "dummyhash",
      role: "OWNER",
      status: "ACTIVE"
    }
  });

  let personA1, personA2, personB1;
  let profileA1, profileA2, profileB1;
  let proposal;

  try {
    // 2. Setup Clients
    personA1 = await prisma.person.create({
      data: {
        firstName: "Priya",
        lastName: "Sharma",
        gender: "FEMALE",
        email: "priya@example.com",
        mobile: "1111111111"
      }
    });

    profileA1 = await prisma.agencyProfile.create({
      data: {
        agencyId: agencyA.id,
        personId: personA1.id,
        profileNumber: `TEST-A1-${Date.now()}`,
        profileType: "BRIDE",
        status: "ACTIVE"
      }
    });

    personA2 = await prisma.person.create({
      data: {
        firstName: "Anjali",
        lastName: "Mehta",
        gender: "FEMALE",
        email: "anjali@example.com",
        mobile: "2222222222"
      }
    });

    profileA2 = await prisma.agencyProfile.create({
      data: {
        agencyId: agencyA.id,
        personId: personA2.id,
        profileNumber: `TEST-A2-${Date.now()}`,
        profileType: "BRIDE",
        status: "ACTIVE"
      }
    });

    personB1 = await prisma.person.create({
      data: {
        firstName: "Rohit",
        lastName: "Varma",
        gender: "MALE",
        email: "rohit@example.com",
        mobile: "3333333333"
      }
    });

    profileB1 = await prisma.agencyProfile.create({
      data: {
        agencyId: agencyB.id,
        personId: personB1.id,
        profileNumber: `TEST-B1-${Date.now()}`,
        profileType: "GROOM",
        status: "ACTIVE"
      }
    });

    // Case 1: Same agency check
    console.log("\nCase 1: Agency A OWNER fetching client A1 (Same agency)...");
    const viewA1 = await service.getProfileById(profileA1.id, agencyA.id, agencyUserA.id);
    if (viewA1.person && viewA1.person.email === "priya@example.com" && viewA1.person.mobile === "1111111111") {
      console.log("PASS: Same agency fetch returned unmasked email/mobile.");
    } else {
      console.log("FAIL: Same agency fetch was incorrectly masked.");
    }

    // Case 2: Cross agency check without viewerProfileId
    console.log("\nCase 2: Agency A OWNER fetching candidate B1 without viewerProfileId (Cross agency)...");
    const viewB1_noViewer = await service.getProfileById(profileB1.id, agencyA.id, agencyUserA.id);
    if (viewB1_noViewer.person && viewB1_noViewer.person.email?.includes("Hidden") && viewB1_noViewer.person.mobile?.includes("Hidden")) {
      console.log("PASS: Cross-agency fetch without viewerProfileId was successfully masked.");
    } else {
      console.log("FAIL: Cross-agency fetch without viewerProfileId leaked details.");
    }

    // Case 3: Cross agency check with viewerProfileId but no accepted proposal
    console.log("\nCase 3: Agency A OWNER fetching candidate B1 with viewerProfileId = A1 (Cross agency, no proposal)...");
    const viewB1_noProposal = await service.getProfileById(profileB1.id, agencyA.id, agencyUserA.id, profileA1.id);
    if (viewB1_noProposal.person && viewB1_noProposal.person.email?.includes("Hidden") && viewB1_noProposal.person.mobile?.includes("Hidden")) {
      console.log("PASS: Cross-agency fetch with no proposal was successfully masked.");
    } else {
      console.log("FAIL: Cross-agency fetch with no proposal leaked details.");
    }

    // Case 4: Cross agency check with spoofed viewerProfileId (B1 belongs to Agency B, requested under Agency A credentials)
    console.log("\nCase 4: Agency A OWNER fetching candidate B1 spoofing viewerProfileId = B1...");
    const viewB1_spoofed = await service.getProfileById(profileB1.id, agencyA.id, agencyUserA.id, profileB1.id);
    if (viewB1_spoofed.person && viewB1_spoofed.person.email?.includes("Hidden") && viewB1_spoofed.person.mobile?.includes("Hidden")) {
      console.log("PASS: Spoofed viewerProfileId was detected and details were successfully masked.");
    } else {
      console.log("FAIL: Spoofed viewerProfileId leaked details.");
    }

    // 3. Create mutually accepted proposal between A1 and B1
    proposal = await prisma.proposal.create({
      data: {
        proposalNumber: `PROP-${Date.now()}`,
        senderAgencyId: agencyA.id,
        receiverAgencyId: agencyB.id,
        brideProfileId: profileA1.id,
        groomProfileId: profileB1.id,
        matchType: "CROSS_AGENCY",
        proposalStatus: "ACCEPTED",
        brideAccepted: true,
        groomAccepted: true,
        createdBy: "SYSTEM"
      }
    });

    // Case 5: Cross agency check with accepted proposal pair (A1 ↔ B1)
    console.log("\nCase 5: Agency A OWNER fetching candidate B1 with viewerProfileId = A1 (Cross agency, accepted proposal pair)...");
    const viewB1_accepted = await service.getProfileById(profileB1.id, agencyA.id, agencyUserA.id, profileA1.id);
    if (viewB1_accepted.person && viewB1_accepted.person.email === "rohit@example.com" && viewB1_accepted.person.mobile === "3333333333") {
      console.log("PASS: Accepted proposal pair allowed unmasked details.");
    } else {
      console.log("FAIL: Accepted proposal pair was incorrectly masked.");
    }

    // Case 6: Cross agency check for A2 viewing B1 (A2 belongs to Agency A, has no accepted proposal with B1, but A1 does)
    console.log("\nCase 6: Agency A OWNER fetching candidate B1 with viewerProfileId = A2 (Cross agency, other agency client has proposal)...");
    const viewB1_otherClient = await service.getProfileById(profileB1.id, agencyA.id, agencyUserA.id, profileA2.id);
    if (viewB1_otherClient.person && viewB1_otherClient.person.email?.includes("Hidden") && viewB1_otherClient.person.mobile?.includes("Hidden")) {
      console.log("PASS: Other client in same agency was successfully masked (no agency-wide leakage).");
    } else {
      console.log("FAIL: Other client in same agency leaked details.");
    }

  } finally {
    console.log("\nCleaning up visibility verification records...");
    if (proposal) {
      await prisma.proposal.delete({ where: { id: proposal.id } }).catch(() => {});
    }
    if (profileA1) {
      await prisma.agencyProfile.delete({ where: { id: profileA1.id } }).catch(() => {});
    }
    if (personA1) {
      await prisma.person.delete({ where: { id: personA1.id } }).catch(() => {});
    }
    if (profileA2) {
      await prisma.agencyProfile.delete({ where: { id: profileA2.id } }).catch(() => {});
    }
    if (personA2) {
      await prisma.person.delete({ where: { id: personA2.id } }).catch(() => {});
    }
    if (profileB1) {
      await prisma.agencyProfile.delete({ where: { id: profileB1.id } }).catch(() => {});
    }
    if (personB1) {
      await prisma.person.delete({ where: { id: personB1.id } }).catch(() => {});
    }
    if (agencyUserA) {
      await prisma.agencyUser.delete({ where: { id: agencyUserA.id } }).catch(() => {});
    }
    await prisma.agency.delete({ where: { id: agencyA.id } }).catch(() => {});
    await prisma.agency.delete({ where: { id: agencyB.id } }).catch(() => {});
  }
}

run().catch(console.error);
