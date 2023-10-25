import express from "express";
import { getAllUsers } from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.route("/")
    .get(protect, getAllUsers);

export default router;
