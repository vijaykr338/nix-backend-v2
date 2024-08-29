import express from "express";

import {
  getEventsController,
  createEventsController,
  updateEventController,
} from "../controllers/eventController";
import { protect } from "../middlewares/authMiddleware";
import Permission from "../helpers/permissions";
import protected_route from "../middlewares/permsMiddlewareInit";

const router = express.Router();

const createUpdateProtect = protected_route([Permission.CreateUpdateEvent]);

router.route("/").get(protect, getEventsController);
router
  .route("/create-event")
  .post(protect, createUpdateProtect, createEventsController);
router
  .route("/update-event")
  .post(protect, createUpdateProtect, updateEventController);

export default router;
