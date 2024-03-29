import express from "express";
import {
  getAllUsers,
  getCurrentUserController,
  permsUpdateController,
  updateUserController,
} from "../controllers/userController";
import { protect } from "../middlewares/authMiddleware";
import protected_route from "../middlewares/permsMiddlewareInit";
import Permission from "../helpers/permissions";

const router = express.Router();

const UpdateProfileProtect = protected_route([Permission.UpdateProfile]);

router.route("/").get(protect, getAllUsers);

router.route("/current-user").get(protect, getCurrentUserController);

router.route("/update-user").put(protect, updateUserController);

router.route("/update-perms/:id").put(protect, UpdateProfileProtect, permsUpdateController);

export default router;
