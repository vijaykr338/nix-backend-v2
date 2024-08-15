import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { get_totp } from "../controllers/totpController";
import Permission from "../helpers/permissions";
import protected_route from "../middlewares/permsMiddlewareInit";

const router = express.Router();
const totp_protect = protected_route([Permission.AccessLogs]);

router.route("/").get(protect, totp_protect, get_totp);

export default router;
