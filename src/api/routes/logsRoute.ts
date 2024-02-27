import express from "express";
import protected_route from "../middlewares/permsMiddlewareInit";
import Permission from "../helpers/permissions";
import { clear_logs, get_logs } from "../middlewares/logsMiddleware";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

const protect_logs = protected_route([Permission.AccessLogs]);

router.route("/").get(protect, protect_logs, get_logs);
router.route("/clear").get(protect, protect_logs, clear_logs);

export default router;
