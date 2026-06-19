import { prisma } from "../../backend/src/config/prisma.js";

async function backfill() {
  console.log("Starting backfill for clients with NULL assignedUserId...");

  // Find all clients
  const clients = await prisma.client.findMany({
    where: {
      assignedUserId: null
    }
  });

  console.log(`Found ${clients.length} clients with NULL assignedUserId.`);

  let updatedCount = 0;

  for (const client of clients) {
    // Find the owner of the client's agency
    const owner = await prisma.agencyUser.findFirst({
      where: {
        agencyId: client.agencyId,
        role: "OWNER"
      }
    });

    if (owner) {
      await prisma.client.update({
        where: { id: client.id },
        data: { assignedUserId: owner.id }
      });
      console.log(`Updated client ${client.clientCode} to owner ${owner.username}`);
      updatedCount++;
    } else {
      console.warn(`No owner found for agency ${client.agencyId} of client ${client.clientCode}`);
    }
  }

  console.log(`Backfill finished. Updated ${updatedCount} clients.`);
}

backfill().catch(console.error).finally(() => prisma.$disconnect());
