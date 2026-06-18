import { Router } from "express";
import { ClientController } from "./client.controller";
import { requireRole } from "../auth/role.middleware";

const router = Router();
const clientController = new ClientController();

// Read operations — OWNER and PROFILE_MANAGER
router.get("/", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => clientController.getClients(req, res));
router.get("/:id", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => clientController.getClientById(req, res));
router.get("/:id/notes", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => clientController.getNotes(req, res));
router.get("/:id/payments", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => clientController.getPayments(req, res));

// Write operations — OWNER and PROFILE_MANAGER
router.post("/", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => clientController.createClient(req, res));
router.post("/:id/notes", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => clientController.addNote(req, res));
router.post("/:id/payments", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => clientController.addPayment(req, res));

// Update operations — OWNER and PROFILE_MANAGER
router.put("/:id", requireRole(["OWNER", "PROFILE_MANAGER"]), (req, res) => clientController.updateClient(req, res));

export { router as clientRoutes };