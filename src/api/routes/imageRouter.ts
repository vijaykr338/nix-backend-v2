import express from "express";
import protected_route from "../middlewares/permsMiddlewareInit";
import Permission from "../helpers/permissions";
import { protect } from "../middlewares/authMiddleware";
import multer from "multer";
import { get_image, upload_image } from "../controllers/imageController";

const storage = multer({
  fileFilter: function (req, file, callback) {
    const fileExtension = (file.originalname.split(".")[file.originalname.split(".").length - 1]).toLowerCase();

    if (["png", "jpg", "jpeg"].indexOf(fileExtension) === -1) {
      return callback(null, false);
    }
    callback(null, true);
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now().toString()}-${file.originalname}`);
    },
  })
});

const router = express.Router();

const protect_image_upload = protected_route([Permission.UploadImage]);

router.route("/upload").post(protect, protect_image_upload, storage.single("avatar"), upload_image);
router.route("/get").get(get_image);

export default router;
