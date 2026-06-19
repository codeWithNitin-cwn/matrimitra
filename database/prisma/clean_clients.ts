import { prisma } from "../../backend/src/config/prisma.js";

async function clean() {
  console.log("Starting duplicate clients cleanup...");

  // Fetch all clients with counts of related data
  const clients = await prisma.client.findMany({
    include: {
      profiles: true,
      notes: true,
      payments: true
    }
  });

  // Group clients by agencyId + mobile + email
  const groups: Record<string, typeof clients> = {};
  for (const c of clients) {
    // If mobile or email is missing, we can still group, but they are defined in our seeds
    const key = `${c.agencyId}_${c.mobile || ""}_${c.email || ""}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(c);
  }

  const duplicatesFound: string[] = [];
  const clientsRemoved: string[] = [];
  const clientsRetained: string[] = [];

  for (const [key, group] of Object.entries(groups)) {
    if (group.length > 1) {
      console.log(`Found duplicate group with ${group.length} clients for key: ${key}`);
      
      // Find the client linked to the surviving/active profile
      // Or if none, keep the first one
      let retainedClient = group.find(c => c.profiles.length > 0);
      if (!retainedClient) {
        retainedClient = group[0];
      }

      clientsRetained.push(`${retainedClient.firstName} ${retainedClient.lastName || ""} (${retainedClient.clientCode})`);
      console.log(`Retaining client: ${retainedClient.clientCode} (${retainedClient.id})`);

      for (const c of group) {
        if (c.id === retainedClient.id) {
          continue;
        }

        duplicatesFound.push(c.clientCode);

        // Check if there is any related business data
        const profileCount = c.profiles.length;
        const notesCount = c.notes.length;
        const paymentsCount = c.payments.length;

        if (profileCount === 0 && notesCount === 0 && paymentsCount === 0) {
          console.log(`Deleting orphan client: ${c.clientCode} (${c.id})`);
          await prisma.client.delete({
            where: { id: c.id }
          });
          clientsRemoved.push(c.clientCode);
        } else {
          console.warn(`Warning: Client ${c.clientCode} has active relations (profiles: ${profileCount}, notes: ${notesCount}, payments: ${paymentsCount}). Skipping delete.`);
        }
      }
    }
  }

  console.log("Cleanup finished.");
  console.log("Duplicates found:", duplicatesFound);
  console.log("Clients removed:", clientsRemoved);
  console.log("Clients retained:", clientsRetained);
}

clean().catch(console.error).finally(() => prisma.$disconnect());
