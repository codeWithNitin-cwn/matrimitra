import { Router } from "express";
import { ClientController } from "./client.controller";
import { requireRole } from "../auth/role.middleware";

const router = Router();
const clientController = new ClientController();

// Read operations — all roles
router.get("/", (req, res) => clientController.getClients(req, res));
router.get("/:id", (req, res) => clientController.getClientById(req, res));
router.get("/:id/notes", (req, res) => clientController.getNotes(req, res));
router.get("/:id/payments", (req, res) => clientController.getPayments(req, res));

// Write operations — EXECUTIVE and above
router.post("/", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => clientController.createClient(req, res));
router.post("/:id/notes", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => clientController.addNote(req, res));
router.post("/:id/payments", requireRole(["OWNER", "MANAGER", "EXECUTIVE"]), (req, res) => clientController.addPayment(req, res));

// Update operations — MANAGER and above
router.put("/:id", requireRole(["OWNER", "MANAGER"]), (req, res) => clientController.updateClient(req, res));

export { router as clientRoutes };