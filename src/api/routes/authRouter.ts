import express from "express";
import {
  refresh,
  signup,
  login,
  forgotPassword,
  resetPassword,
  logout,
} from "../controllers/authController";
import protected_route from "../middlewares/permsMiddlewareInit";
import Permission from "../helpers/permissions";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

const signup_protect = protected_route([Permission.CreateProfile]);

router.route("/signup").post(protect, signup_protect, signup);
router.post("/login", login);
router.get("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);

export default router;
