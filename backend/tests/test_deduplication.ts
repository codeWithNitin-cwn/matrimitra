import { prisma } from "../src/config/prisma.js";
import { ProfileService } from "../src/modules/profile/profile.service.js";

async function run() {
  const profileService = new ProfileService();

  const profile = await prisma.agencyProfile.findFirst();
  if (!profile) throw new Error("No profile found");

  const user = await prisma.agencyUser.findFirst();
  if (!user) throw new Error("No user found");

  console.log("Initial count of access logs for this profile & user:", await prisma.profileAccessLog.count({
    where: { profileId: profile.id, viewedByUserId: user.id, action: "VIEW_PROFILE" }
  }));

  // Log access 5 times consecutively
  for (let i = 0; i < 5; i++) {
    await profileService.logAccess(profile.id, user.agencyId, user.id, "VIEW_PROFILE");
  }

  const finalCount = await prisma.profileAccessLog.count({
    where: { profileId: profile.id, viewedByUserId: user.id, action: "VIEW_PROFILE" }
  });

  console.log("Final count of access logs for this profile & user:", finalCount);
}

run().catch(console.error).finally(() => prisma.$disconnect());
