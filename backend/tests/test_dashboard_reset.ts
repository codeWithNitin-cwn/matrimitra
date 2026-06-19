import { ReportingRepository } from '../src/modules/reporting/reporting.repository.js';
import { prisma } from '../src/config/prisma.js';

async function run() {
  const repo = new ReportingRepository();
  console.log("Running getDashboardSummary test...");
  
  // Find or use a dummy UUID
  const agency = await prisma.agency.findFirst();
  const agencyId = agency?.id || "00000000-0000-0000-0000-000000000000";
  console.log(`Using agencyId: ${agencyId}`);

  try {
    const summary = await repo.getDashboardSummary(agencyId);
    console.log("Success! Summary fetched successfully:", Object.keys(summary));
  } catch (error: any) {
    console.error("Dashboard error caught:");
    console.error(error.stack || error);
  }
}

run().catch(console.error);
