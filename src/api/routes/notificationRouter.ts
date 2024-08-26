import express from "express";
import {
  get_notif,
  save_notif,
  subscribe,
} from "../controllers/notificationController";

const router = express.Router();

router.route("/").get(get_notif);
router.route("/subscribe").post(subscribe);
router.route("/save").post(save_notif);

export default router;
