import multer from "multer";
import CustomError from "../../config/CustomError";
import StatusCode from "../helpers/httpStatusCode";

export const enum ImageType {
  General,
  Avatar,
  Edition,
}

export const storage = multer({
  fileFilter: function (req, file, callback) {
    const fileExtension = file.originalname
      .split(".")
      [file.originalname.split(".").length - 1].toLowerCase();

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
      req.body.image_type = ImageType.General;
      const updation_req = req.path.includes("update");
      const filename_original = file.originalname
        .replace(/[^a-z0-9\s.]/gi, "")
        .replace(/\s/g, "_");
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
  }),
});

export const avatarStorage = multer({
  fileFilter: function (req, file, callback) {
    const fileExtension = file.originalname
      .split(".")
      [file.originalname.split(".").length - 1].toLowerCase();

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
      req.body.image_type = ImageType.Avatar;
      const filename = req.body.user_id;
      req.query.thumbnail = "true"; // to force generate thumbnail in next middleware
      if (!filename) {
        // should not be rechable because of the way we route here through protect middleware
        const err = new CustomError(
          "Required information not found! Please relogin.",
          StatusCode.BAD_REQUEST,
        );
        return cb(err, "error");
      }
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  },
});

export const editionStorage = multer({
  fileFilter: function (req, file, callback) {
    const fileExtension = file.originalname
      .split(".")
      [file.originalname.split(".").length - 1].toLowerCase();

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
      req.body.image_type = ImageType.Edition;
      const filename = `edition-${req.params.id}`;
      req.query.thumbnail = "true"; // to force generate thumbnail in next middleware
      if (!filename) {
        // should not be rechable because of the way we route here through protect middleware
        const err = new CustomError(
          "Required information not found! Please relogin.",
          StatusCode.BAD_REQUEST,
        );
        return cb(err, "error");
      }
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  },
});
