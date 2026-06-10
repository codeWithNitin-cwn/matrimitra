import express from "express";
import cors from "cors";
import { prisma } from "./config/prisma";
import agencyRoutes from "./modules/agency/agency.routes";
import { agencyUserRoutes } from "./modules/agency-user/agency-user.routes";
import { clientRoutes } from "./modules/client/client.routes";
import { profileRoutes } from "./modules/profile/profile.routes";
import { questionRoutes } from "./modules/question/question.routes";
import { matchRoutes } from "./modules/match/match.routes";
import { proposalRoutes } from "./modules/proposal/proposal.routes";
import { pipelineRoutes } from "./modules/pipeline/pipeline.routes";
import { reportingRoutes } from "./modules/reporting/reporting.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { authenticate } from "./modules/auth/auth.middleware";

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/v1/auth", authRoutes); // Public route

app.use("/api/v1", authenticate); // Protect all downstream v1 API routes

app.use("/api/v1/agencies", agencyRoutes);
app.use("/api/v1/agency-users", agencyUserRoutes);
app.use("/api/v1/clients", clientRoutes);
app.use("/api/v1/profiles", profileRoutes);
app.use("/api/v1/questions", questionRoutes);
app.use("/api/v1/matches", matchRoutes);
app.use("/api/v1/proposals", proposalRoutes);
app.use("/api/v1/pipeline", pipelineRoutes);
app.use("/api/v1/reports", reportingRoutes);

app.get("/", async (req, res) => {
  const agencyCount = await prisma.agency.count();

  res.json({
    success: true,
    message: "Prisma Connected",
    agencies: agencyCount
  });
});

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});