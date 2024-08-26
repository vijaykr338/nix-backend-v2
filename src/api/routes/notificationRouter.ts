import express from "express";
import {
  get_notif,
  save_notif,
  subscribe,
  test_notif,
} from "../controllers/notificationController";

const router = express.Router();

router.route("/").get(get_notif);
router.route("/subscribe").post(subscribe);
router.route("/save").post(save_notif);
router.route("/test_notif").get(test_notif);

export default router;
