import { Router } from "express";
import { ClientController } from "./client.controller";

const router = Router();
const clientController = new ClientController();

router.post("/", (req, res) => clientController.createClient(req, res));

export { router as clientRoutes };