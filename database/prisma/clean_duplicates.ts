import { prisma } from "../../backend/src/config/prisma.js";

async function clean() {
  console.log("Starting duplicate profiles cleanup...");

  // Find all profiles with their person details
  const profiles = await prisma.agencyProfile.findMany({
    include: {
      person: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  // Group by "firstName lastName"
  const groups: Record<string, typeof profiles> = {};
  for (const p of profiles) {
    const fullName = `${p.person.firstName} ${p.person.lastName || ""}`.trim();
    if (fullName === "Ananya Sharma") {
      continue; // Do not modify Ananya Sharma
    }
    if (!groups[fullName]) {
      groups[fullName] = [];
    }
    groups[fullName].push(p);
  }

  let removedCount = 0;
  const duplicateProfilesFound: string[] = [];
  const profilesRemoved: string[] = [];

  for (const [fullName, list] of Object.entries(groups)) {
    if (list.length > 1) {
      console.log(`Found ${list.length} profiles for: ${fullName}`);
      // Keep the first one, delete the rest
      const [retained, ...duplicates] = list;
      console.log(`Retaining profile: ${retained.profileNumber} (${retained.id})`);

      for (const dup of duplicates) {
        duplicateProfilesFound.push(dup.profileNumber);
        profilesRemoved.push(dup.profileNumber);
        console.log(`Deleting duplicate profile: ${dup.profileNumber} (${dup.id})`);

        await prisma.$transaction(async (tx) => {
          const profileId = dup.id;

          // Delete dependent tables
          await tx.profilePersonal.deleteMany({ where: { profileId } });
          await tx.profileEducation.deleteMany({ where: { profileId } });
          await tx.profileCareer.deleteMany({ where: { profileId } });
          await tx.profileFamily.deleteMany({ where: { profileId } });
          await tx.profileLifestyle.deleteMany({ where: { profileId } });
          await tx.profilePreference.deleteMany({ where: { profileId } });
          await tx.profilePhoto.deleteMany({ where: { profileId } });
          await tx.profileDocument.deleteMany({ where: { profileId } });
          await tx.profileAnswer.deleteMany({ where: { profileId } });
          await tx.userTrait.deleteMany({ where: { profileId } });
          await tx.followUp.deleteMany({ where: { profileId } });
          await tx.profileAccessLog.deleteMany({ where: { profileId } });
          
          await tx.proposal.deleteMany({
            where: {
              OR: [
                { brideProfileId: profileId },
                { groomProfileId: profileId }
              ]
            }
          });

          await tx.agencyProfile.delete({ where: { id: profileId } });

          // Check if person is used by other profiles
          const otherCount = await tx.agencyProfile.count({
            where: { personId: dup.personId }
          });
          if (otherCount === 0) {
            await tx.person.delete({ where: { id: dup.personId } });
          }
        });

        removedCount++;
      }
    }
  }

  console.log(`Cleanup finished! Removed ${removedCount} duplicate profiles.`);
  console.log("Duplicate profiles found:", duplicateProfilesFound);
  console.log("Profiles removed:", profilesRemoved);
}

clean().catch(console.error).finally(() => prisma.$disconnect());
