import { Router } from "express";
import { AgencyController } from "./agency.controller";

const router = Router();
const agencyController = new AgencyController();

router.post("/", (req, res) => agencyController.createAgency(req, res));

export default router;