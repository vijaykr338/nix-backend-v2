import express from "express";
import Permission from "../helpers/permissions";
import StatusCode from "../helpers/httpStatusCode";
import userRouter from "./userRoute";
import authRouter from "./authRouter";
import roleRouter from "./roleRoute";
import blogRouter from "./blogRoute";
import logsRouter from "./logsRoute";
import imageRouter from "./imageRouter";
import editionRouter from "./editionRoute";
import dashboardRouter from "./dashboardRoute";
import totpRouter from "./totpRouter";
import notificationRouter from "./notificationRouter";

const router = express.Router();

router.use("/notification", notificationRouter);
router.use("/totp", totpRouter);
router.use("/user", userRouter);
router.use("/auth", authRouter);
router.use("/role", roleRouter);
router.use("/blog", blogRouter);
router.use("/logs", logsRouter);
router.use("/images", imageRouter);
router.use("/edition", editionRouter);
router.use("/dashboard", dashboardRouter);
router.all("/permissions", (req, res) => {
  const all_permissions = Object.entries(Permission)
    .filter(([, perm_id]) => typeof perm_id === "number")
    .reduce((acc, [perm_name, perm_id]) => {
      acc[perm_id] = perm_name;
      return acc;
    }, {});
  res.status(StatusCode.OK).json({
    status: "success",
    message: "All permissions retrieved successfully",
    data: all_permissions,
  });
});

export default router;
