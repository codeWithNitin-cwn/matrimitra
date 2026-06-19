import { prisma } from "../../backend/src/config/prisma.js";

async function check() {
  const users = await prisma.agencyUser.findMany({
    select: {
      username: true,
      role: true,
      agency: { select: { name: true } }
    }
  });
  console.log("Users in DB:");
  console.log(users);

  const profiles = await prisma.agencyProfile.findMany({
    select: {
      profileNumber: true,
      status: true,
      person: { select: { firstName: true, lastName: true } },
      agency: { select: { name: true } }
    }
  });
  console.log("Profiles in DB:");
  console.log(profiles);
}

check().catch(console.error).finally(() => prisma.$disconnect());
