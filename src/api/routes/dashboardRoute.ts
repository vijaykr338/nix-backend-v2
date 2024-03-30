import express from "express";
import { protect } from "../middlewares/authMiddleware";
import {
  getBlogsCountInEachCategory,
  getTopUsers,
} from "../controllers/dashboardController";

const router = express.Router();

router.route("/top-users").get(protect, getTopUsers);
router.route("/blogs-by-category").get(protect, getBlogsCountInEachCategory);

export default router;
