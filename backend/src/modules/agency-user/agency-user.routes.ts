import { Router } from "express";
import { AgencyUserController } from "./agency-user.controller";

const router = Router();
const agencyUserController = new AgencyUserController();

router.post("/", (req, res) => agencyUserController.createAgencyUser(req, res));

export { router as agencyUserRoutes };