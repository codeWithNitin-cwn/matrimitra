import { prisma } from "../../backend/src/config/prisma.js";

async function run() {
  const res = await prisma.agencyProfile.updateMany({
    where: { person: { firstName: 'Ananya' } },
    data: { status: 'DRAFT' }
  });
  console.log("Updated to DRAFT:", res);
}

run().catch(console.error).finally(() => prisma.$disconnect());
