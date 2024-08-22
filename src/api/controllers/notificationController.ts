import CustomError from "../../config/CustomError";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import StatusCode from "../helpers/httpStatusCode";
import { Notification } from "../models/notificationModel";

export const save_notif = asyncErrorHandler(async (req, res, _next) => {
  if (req.body.secret != process.env.NOTIF_SECRET) {
    throw new CustomError("Invalid secret", StatusCode.BAD_REQUEST);
  }

  console.log(
    await Notification.create({
      data: req.body.data,
      updated_at: new Date(),
    })
  );

  res.json({
    status: "success",
    message: "Notification saved successfully",
  });
});

export const get_notif = asyncErrorHandler(async (req, res, _next) => {
  const notifications = await Notification.find().sort({ updated_at: -1 });

  res.json({
    status: "success",
    message: "Notifications fetched successfully",
    data: notifications,
  });
});
