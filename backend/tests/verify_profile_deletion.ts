import { prisma } from '../src/config/prisma.js';
import { ProfileService } from '../src/modules/profile/profile.service.js';

async function run() {
  const service = new ProfileService();
  console.log("Starting Profile Deletion verification...");

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
        email: `receiver-del-${Date.now()}@example.com`,
        mobile: "1234567890",
        city: "TestCity",
        state: "TestState",
        country: "TestCountry",
        agencyCode: `TEST-AGD-${Date.now()}`
      }
    });
    createdAgencyB = true;
  }

  try {
    // 1. Create a draft profile for Agency A
    const personA = await prisma.person.create({ data: { firstName: "DraftPersonA", gender: "FEMALE" } });
    const profileA = await prisma.agencyProfile.create({
      data: {
        agencyId: agencyA.id,
        personId: personA.id,
        profileNumber: `TEST-DEL-A-${Date.now()}`,
        profileType: "BRIDE",
        status: "DRAFT"
      }
    });

    // Create some sub-details for profileA to test cascade delete
    await prisma.profilePersonal.create({
      data: {
        profileId: profileA.id,
        city: "TestCity"
      }
    });

    // 2. Create an active profile for Agency A
    const personActive = await prisma.person.create({ data: { firstName: "ActivePersonA", gender: "FEMALE" } });
    const profileActive = await prisma.agencyProfile.create({
      data: {
        agencyId: agencyA.id,
        personId: personActive.id,
        profileNumber: `TEST-DEL-ACT-${Date.now()}`,
        profileType: "BRIDE",
        status: "ACTIVE"
      }
    });

    // 3. Create a draft profile for Agency B
    const personB = await prisma.person.create({ data: { firstName: "DraftPersonB", gender: "MALE" } });
    const profileB = await prisma.agencyProfile.create({
      data: {
        agencyId: agencyB.id,
        personId: personB.id,
        profileNumber: `TEST-DEL-B-${Date.now()}`,
        profileType: "GROOM",
        status: "DRAFT"
      }
    });

    // Case 1: Non-OWNER tries to delete Draft profile => Should fail
    try {
      console.log("\nCase 1: PROFILE_MANAGER (non-OWNER) deleting profile...");
      await service.deleteProfile(profileA.id, agencyA.id, "PROFILE_MANAGER");
      console.log("FAIL: Non-OWNER was allowed to delete profile.");
    } catch (error: any) {
      if (error.message.includes("Only OWNER can delete")) {
        console.log(`PASS: Rejected with expected error: "${error.message}"`);
      } else {
        console.log(`FAIL: Rejected with unexpected error: "${error.message}"`);
      }
    }

    // Case 2: OWNER tries to delete non-DRAFT profile => Should fail
    try {
      console.log("\nCase 2: OWNER deleting ACTIVE profile...");
      await service.deleteProfile(profileActive.id, agencyA.id, "OWNER");
      console.log("FAIL: OWNER was allowed to delete an ACTIVE profile.");
    } catch (error: any) {
      if (error.message.includes("Only DRAFT profiles can be deleted")) {
        console.log(`PASS: Rejected with expected error: "${error.message}"`);
      } else {
        console.log(`FAIL: Rejected with unexpected error: "${error.message}"`);
      }
    }

    // Case 3: OWNER tries to delete foreign profile => Should fail
    try {
      console.log("\nCase 3: OWNER deleting foreign profile (Agency B)...");
      await service.deleteProfile(profileB.id, agencyA.id, "OWNER");
      console.log("FAIL: OWNER was allowed to delete another agency's profile.");
    } catch (error: any) {
      if (error.message.includes("Profile belongs to another agency")) {
        console.log(`PASS: Rejected with expected error: "${error.message}"`);
      } else {
        console.log(`FAIL: Rejected with unexpected error: "${error.message}"`);
      }
    }

    // Case 4: OWNER deletes own DRAFT profile => Should succeed and cascade delete
    try {
      console.log("\nCase 4: OWNER deleting own DRAFT profile...");
      await service.deleteProfile(profileA.id, agencyA.id, "OWNER");
      console.log("PASS: Profile deleted successfully.");

      // Verify cascading database deletion
      const deletedProfile = await prisma.agencyProfile.findUnique({ where: { id: profileA.id } });
      const deletedPersonal = await prisma.profilePersonal.findUnique({ where: { profileId: profileA.id } });
      const deletedPerson = await prisma.person.findUnique({ where: { id: personA.id } });

      if (!deletedProfile && !deletedPersonal && !deletedPerson) {
        console.log("PASS: Confirmed all dependent records (AgencyProfile, ProfilePersonal, Person) were cascade deleted!");
      } else {
        console.log(`FAIL: Orphaned records remain in DB! Profile: ${!!deletedProfile}, Personal: ${!!deletedPersonal}, Person: ${!!deletedPerson}`);
      }
    } catch (error: any) {
      console.log(`FAIL: OWNER could not delete own DRAFT profile. Error: ${error.message}`);
    }

    // Clean up remains
    await prisma.agencyProfile.delete({ where: { id: profileActive.id } });
    await prisma.person.delete({ where: { id: personActive.id } });
    await prisma.agencyProfile.delete({ where: { id: profileB.id } });
    await prisma.person.delete({ where: { id: personB.id } });

  } finally {
    if (createdAgencyB) {
      console.log("\nCleaning up receiver agency...");
      await prisma.agency.delete({ where: { id: agencyB.id } });
    }
  }
}

run().catch(console.error);
