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
import { CreateProfile } from "../helpers/permissions";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

const signup_protect = protected_route([new CreateProfile()]);

router.route("/signup").post(protect, signup_protect, signup);
router.route("/login").post(login);
router.get("/refresh", refresh);
router.get("/logout", logout);

router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);

export default router;
