import { Router } from "express";
import { AgencyUserController } from "./agency-user.controller";
import { requireRole } from "../auth/role.middleware";
const router = Router();
const agencyUserController = new AgencyUserController();

router.get(
  "/",
  requireRole(["OWNER"]),
  (req, res) => agencyUserController.getAgencyUsers(req, res)
);

router.post(
  "/",
  requireRole(["OWNER"]),
  (req, res) => agencyUserController.createAgencyUser(req, res)
);

router.put(
  "/:id",
  requireRole(["OWNER"]),
  (req, res) => agencyUserController.updateAgencyUser(req, res)
);

export { router as agencyUserRoutes };