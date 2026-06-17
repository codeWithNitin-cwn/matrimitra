import { prisma } from "./config/prisma.js";
import { ReportingRepository } from "./modules/reporting/reporting.repository.js";
import { ReportingService } from "./modules/reporting/reporting.service.js";

async function main() {
  console.log("⚙ Starting Verification for Dashboard V2 Phase 2 Reporting & Metrics...");

  const agency = await prisma.agency.findFirst();
  if (!agency) {
    console.error("❌ No agencies found in database to run live query tests.");
    return;
  }

  const agencyId = agency.id;
  console.log(`\nUsing Agency: ${agency.name} (ID: ${agencyId})`);

  const repository = new ReportingRepository();
  const service = new ReportingService();

  // 1. Dashboard summary live queries
  console.log("\n--- Testing getDashboardSummary ---");
  const summary = await repository.getDashboardSummary(agencyId);
  console.log("Dashboard Summary Result:");
  console.log(`- Total Profiles: ${summary.totalProfiles}`);
  console.log(`- Total Clients: ${summary.totalClients}`);
  console.log(`- Matches Generated: ${summary.matchesGenerated}`);
  console.log(`- Proposals Sent: ${summary.proposalsSent}`);
  console.log(`- Accepted Proposals: ${summary.acceptedProposals}`);
  console.log(`- Conversion Rate: ${summary.conversionRate}%`);
  console.log(`- Match Conversion Rate: ${summary.matchConversionRate}%`);

  // Assertions
  if (typeof summary.totalProfiles !== "number" || summary.totalProfiles < 0) throw new Error("Invalid totalProfiles count");
  if (typeof summary.matchesGenerated !== "number" || summary.matchesGenerated < 0) throw new Error("Invalid matchesGenerated count");
  if (typeof summary.proposalsSent !== "number" || summary.proposalsSent < 0) throw new Error("Invalid proposalsSent count");
  if (typeof summary.acceptedProposals !== "number" || summary.acceptedProposals < 0) throw new Error("Invalid acceptedProposals count");
  if (typeof summary.conversionRate !== "number" || summary.conversionRate < 0 || summary.conversionRate > 100) throw new Error("Invalid conversionRate percent");
  if (typeof summary.matchConversionRate !== "number" || summary.matchConversionRate < 0 || summary.matchConversionRate > 100) throw new Error("Invalid matchConversionRate percent");
  console.log("✅ Passed getDashboardSummary assertions.");

  // 2. Proposal status report live queries
  console.log("\n--- Testing getProposalStatusReport ---");
  const proposalStatusReport = await service.getProposalStatusReport(agencyId);
  console.log("Proposal Status Report:", JSON.stringify(proposalStatusReport, null, 2));

  // Assertions
  for (const item of proposalStatusReport) {
    if (typeof item.status !== "string") throw new Error("Proposal status must be string");
    if (typeof item.count !== "number" || item.count < 0) throw new Error("Proposal status count must be positive number");
  }
  console.log("✅ Passed getProposalStatusReport assertions.");

  // 3. Pipeline stage report live queries
  console.log("\n--- Testing getPipelineStageReport ---");
  const pipelineStageReport = await service.getPipelineStageReport(agencyId);
  console.log("Pipeline Stage Report:", JSON.stringify(pipelineStageReport, null, 2));

  // Assertions
  for (const item of pipelineStageReport) {
    if (typeof item.stage !== "string") throw new Error("Pipeline stage must be string");
    if (typeof item.count !== "number" || item.count < 0) throw new Error("Pipeline stage count must be positive number");
  }
  console.log("✅ Passed getPipelineStageReport assertions.");

  // 4. Empty-state safety check
  console.log("\n--- Testing Empty Agency State Handling ---");
  const emptyAgencyId = "00000000-0000-0000-0000-000000000000";
  const emptySummary = await repository.getDashboardSummary(emptyAgencyId);
  const emptyProposalReport = await service.getProposalStatusReport(emptyAgencyId);
  const emptyPipelineReport = await service.getPipelineStageReport(emptyAgencyId);

  console.log(`- Empty Agency Total Profiles: ${emptySummary.totalProfiles}`);
  console.log(`- Empty Agency Matches Generated: ${emptySummary.matchesGenerated}`);
  console.log(`- Empty Agency Proposals Sent: ${emptySummary.proposalsSent}`);
  console.log(`- Empty Agency Accepted Proposals: ${emptySummary.acceptedProposals}`);
  console.log(`- Empty Agency Conversion Rate: ${emptySummary.conversionRate}%`);
  console.log(`- Empty Agency Match Conversion Rate: ${emptySummary.matchConversionRate}%`);
  console.log(`- Empty Agency Proposal Report Length: ${emptyProposalReport.length}`);
  console.log(`- Empty Agency Pipeline Report Length: ${emptyPipelineReport.length}`);

  if (emptySummary.totalProfiles !== 0) throw new Error("Empty agency totalProfiles should be 0");
  if (emptySummary.matchesGenerated !== 0) throw new Error("Empty agency matchesGenerated should be 0");
  if (emptySummary.proposalsSent !== 0) throw new Error("Empty agency proposalsSent should be 0");
  if (emptySummary.acceptedProposals !== 0) throw new Error("Empty agency acceptedProposals should be 0");
  if (emptySummary.conversionRate !== 0) throw new Error("Empty agency conversionRate should be 0");
  if (emptySummary.matchConversionRate !== 0) throw new Error("Empty agency matchConversionRate should be 0");
  if (emptyProposalReport.length !== 0) throw new Error("Empty agency proposal report should be empty array");
  if (emptyPipelineReport.length !== 0) throw new Error("Empty agency pipeline report should be empty array");

  console.log("✅ Passed empty state safety assertions.");
  console.log("\n🎉 ALL REPORTING VERIFICATIONS PASSED SUCCESSFULLY!");
}

main()
  .catch((err) => {
    console.error("❌ Verification failed with error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
