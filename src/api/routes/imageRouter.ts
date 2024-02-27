import express from "express";
import {
  delete_avatar,
  delete_image,
  get_avatar,
  get_image,
  update_image,
  upload_image,
} from "../controllers/imageController";
import Permission from "../helpers/permissions";
import { protect } from "../middlewares/authMiddleware";
import { avatarStorage, storage } from "../middlewares/imageMiddleware";
import protected_route from "../middlewares/permsMiddlewareInit";

const router = express.Router();

const protect_upload = protected_route([Permission.UploadImage]);
const protect_update = protected_route([Permission.UpdateImage]);
const protect_delete = protected_route([Permission.DeleteImage]);

router
  .route("/update/:filename")
  .put(protect, protect_update, storage.single("image"), update_image);
router
  .route("/upload")
  .post(protect, protect_upload, storage.single("image"), upload_image);
router
  .route("/upload-avatar")
  .post(protect, avatarStorage.single("avatar"), upload_image);
router.route("/delete-avatar").delete(protect, delete_avatar);
router.route("/get/:filename").get(get_image);
router.route("/get-avatar/:id").get(get_avatar);
router.route("/delete/:filename").delete(protect, protect_delete, delete_image);

export default router;
