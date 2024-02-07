import express from "express";
import protected_route from "../middlewares/permsMiddlewareInit";
import Permission from "../helpers/permissions";
import { protect } from "../middlewares/authMiddleware";
import multer from "multer";
import { delete_image, get_image, update_image, upload_image } from "../controllers/imageController";

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
      const updation_req = req.path.includes("update");
      const filename_original = file.originalname.replace(/[^a-z0-9\s.]/gi, "").replace(/\s/g, "_");
      if (updation_req) {
        const file_name = req.params.filename;
        if (!file_name) {
          // todo: fix throw if uncaught by our custom error => should not occur because of the way we route here
          throw "filename of replaced file not supplied";
        } else {
          cb(null, req.params.filename);
        }
      } else {
        cb(null, `${Date.now().toString()}-${filename_original}`);
      }
    },
  })
});

const router = express.Router();

const protect_upload = protected_route([Permission.UploadImage]);
const protect_update = protected_route([Permission.UpdateImage]);
const protect_delete = protected_route([Permission.DeleteImage]);

router.route("/update/:filename").put(protect, protect_update, storage.single("avatar"), update_image);
router.route("/upload").post(protect, protect_upload, storage.single("avatar"), upload_image);
router.route("/get/:filename").get(get_image);
router.route("/delete/:filename").delete(protect, protect_delete, delete_image);

export default router;
