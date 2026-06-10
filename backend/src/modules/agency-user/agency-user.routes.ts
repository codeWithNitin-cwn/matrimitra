import { Router } from "express";
import { AgencyUserController } from "./agency-user.controller";
import { requireRole } from "../auth/role.middleware";
const router = Router();
const agencyUserController = new AgencyUserController();

router.post(
  "/",
  requireRole(["OWNER"]),
  (req, res) => agencyUserController.createAgencyUser(req, res)
);

export { router as agencyUserRoutes };