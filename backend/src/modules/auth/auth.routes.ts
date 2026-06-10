import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router();
const authController = new AuthController();

router.post("/login", (req, res) => authController.login(req, res));

export { router as authRoutes };
