import express from "express";
import { getAllUsers, getCurrentUserController } from "../controllers/userController";
import { protect } from "../middlewares/authMiddleware";
const router = express.Router();

router.route("/")
  .get(protect, getAllUsers);

router.route("/current-user").get(protect, getCurrentUserController);

export default router;
