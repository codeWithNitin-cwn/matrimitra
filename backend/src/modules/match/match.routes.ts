import { Router } from "express";
import { MatchController } from "./match.controller";

const router = Router();
const matchController = new MatchController();

router.get("/search/:profileId", (req, res) => matchController.searchMatches(req, res));

export { router as matchRoutes };