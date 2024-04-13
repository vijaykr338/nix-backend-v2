import express from "express";
import {
  getAllUsers,
  getUserController,
  getTeam,
  getCurrentUserController,
  permsUpdateController,
  updateUserController,
  deleteUserController,
} from "../controllers/userController";
import { protect } from "../middlewares/authMiddleware";
import protected_route from "../middlewares/permsMiddlewareInit";
import Permission from "../helpers/permissions";

const router = express.Router();

const updateProfileProtect = protected_route([Permission.UpdateProfile]);
const deleteProfileProtect = protected_route([Permission.DeleteProfile]);

router.route("/").get(protect, getAllUsers);

router.route("/get-team").get(getTeam);

router.route("/current-user").get(protect, getCurrentUserController);

router.route("/get-user/:id").get(protect, getUserController);

router
  .route("/update-user")
  .put(
    protect,
    updateUserController,
    updateProfileProtect,
    permsUpdateController,
  );

router
  .route("delete-user/:id")
  .delete(protect, deleteProfileProtect, deleteUserController);

export default router;
