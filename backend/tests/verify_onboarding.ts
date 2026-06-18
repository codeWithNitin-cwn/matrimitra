import { prisma } from '../src/config/prisma.js';
import { ProfileService } from '../src/modules/profile/profile.service.js';

async function run() {
  const service = new ProfileService();
  console.log("Starting onboarding verification...");

  // 0. Setup a test profile
  const agency = await prisma.agency.findFirst();
  if (!agency) {
    console.error("No agency found in DB to run tests.");
    process.exit(1);
  }
  const person = await prisma.person.create({
    data: {
      firstName: "TestOnboarding",
      lastName: "Client",
      gender: "FEMALE"
    }
  });
  const profile = await prisma.agencyProfile.create({
    data: {
      agencyId: agency.id,
      personId: person.id,
      profileNumber: `TEST-ONB-${Date.now()}`,
      profileType: "BRIDE",
      status: "DRAFT"
    }
  });
  console.log(`Created test profile: ${profile.id}`);

  try {
    // 1. Generate onboarding link
    console.log("\n--- Case 1: Generate onboarding link ---");
    const linkRes = await service.generateOnboardingLink(profile.id, agency.id);
    const p1 = await prisma.agencyProfile.findUnique({ where: { id: profile.id } });
    if (p1 && p1.status === "UNDER_REVIEW" && p1.onboardingToken && !p1.clientApproved && !p1.agencyApproved) {
      console.log("PASS: Status set to UNDER_REVIEW, token generated, approvals reset.");
    } else {
      console.log("FAIL: Incorrect status or values after link generation.");
    }

    // 2. Client approve only
    console.log("\n--- Case 2: Client approve only ---");
    await service.clientApproveProfile(p1!.onboardingToken!);
    const p2 = await prisma.agencyProfile.findUnique({ where: { id: profile.id } });
    if (p2 && p2.clientApproved && !p2.agencyApproved && p2.status === "UNDER_REVIEW") {
      console.log("PASS: Client approved, agency pending, status remains UNDER_REVIEW.");
    } else {
      console.log("FAIL: Incorrect client approval logic.");
    }

    // Reset approval flags for clean tests
    await prisma.agencyProfile.update({
      where: { id: profile.id },
      data: { clientApproved: false, agencyApproved: false, status: "UNDER_REVIEW" }
    });

    // 3. Agency approve only
    console.log("\n--- Case 3: Agency approve only ---");
    try {
      await service.updateStatus(profile.id, agency.id, "MOCK-USER-ID", "ACTIVE");
      console.log("FAIL: updateStatus should throw error because client has not approved.");
    } catch (err: any) {
      const p3 = await prisma.agencyProfile.findUnique({ where: { id: profile.id } });
      if (p3 && p3.agencyApproved && !p3.clientApproved && p3.status === "UNDER_REVIEW") {
        console.log("PASS: Threw error as expected. Agency approved, status remains UNDER_REVIEW.");
      } else {
        console.log("FAIL: Incorrect agency approval only logic.");
      }
    }

    // 4. Both approve
    console.log("\n--- Case 4: Both approve ---");
    // Client approves first
    await service.clientApproveProfile(p1!.onboardingToken!);
    // Agency approves second
    await service.updateStatus(profile.id, agency.id, "MOCK-USER-ID", "ACTIVE");
    const p4 = await prisma.agencyProfile.findUnique({ where: { id: profile.id } });
    if (p4 && p4.clientApproved && p4.agencyApproved && p4.status === "ACTIVE") {
      console.log("PASS: Both approved, status is ACTIVE.");
    } else {
      console.log("FAIL: Both approved but status is not ACTIVE.");
    }

    // 5. Client reject with reason
    console.log("\n--- Case 5: Client reject with reason ---");
    await service.clientRequestChanges(p1!.onboardingToken!, "Please fix my DOB.");
    const p5 = await prisma.agencyProfile.findUnique({ where: { id: profile.id } });
    if (p5 && !p5.clientApproved && p5.clientRejectedReason === "Please fix my DOB." && p5.status === "UNDER_REVIEW") {
      console.log("PASS: Client rejected, reason saved, status remains UNDER_REVIEW.");
    } else {
      console.log("FAIL: Rejection logic failed.");
    }

    // 6. Expired token
    console.log("\n--- Case 6: Expired token ---");
    await prisma.agencyProfile.update({
      where: { id: profile.id },
      data: { onboardingExpiry: new Date(Date.now() - 1000) } // 1 second ago
    });
    try {
      await service.getClientProfileByToken(p1!.onboardingToken!);
      console.log("FAIL: Should fail to fetch expired token.");
    } catch (err: any) {
      console.log("PASS: Expired token threw error: " + err.message);
    }

  } finally {
    // Cleanup
    await prisma.agencyProfile.delete({ where: { id: profile.id } });
    await prisma.person.delete({ where: { id: person.id } });
    console.log("\nTest profile cleaned up.");
  }
}

run().catch(console.error);
