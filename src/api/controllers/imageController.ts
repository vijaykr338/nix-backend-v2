import sharp from "sharp";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import CustomError from "../../config/CustomError";
import StatusCode from "../helpers/httpStatusCode";
import fs from "fs";
import util from "util";

// const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);

const generate_thumbnail = async (image: sharp.Sharp, filename: string) => {
  console.log("Creating thumbnail for", filename);
  const thumbnail = await image.resize(128, 128, { fit: "inside" }).toBuffer();
  await writeFile(`thumbnails/${filename}`, thumbnail);
  return thumbnail;
};

export const upload_image = asyncErrorHandler(async (req, res, next) => {
  const req_file = req.file;
  const is_thumbnail = req.query.thumbnail === "true";

  if (!req_file) {
    const err = new CustomError("Please upload an image and with a proper extension", StatusCode.BAD_REQUEST);
    return next(err);
  }

  console.log("Uploading image", req_file);
  const image = sharp(req_file.path);
  const image_png = image.png();
  if (is_thumbnail) {
    await generate_thumbnail(image_png, req_file.filename);

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        name: req_file.filename,
      }
    });
  }

  res.status(201).json({
    success: true,
    message: "Image uploaded successfully",
  });
});

export const get_image = asyncErrorHandler(async (req, res, next) => {
  const { filename } = req.params;
  const { thumbnail } = req.query;
  if (!filename) {
    return next(new CustomError("Filename is required", StatusCode.BAD_REQUEST));
  }

  if (thumbnail === "true") {
    try {
      const image = sharp(`thumbnails/${filename}`);
      const image_png_buff = await image.png().toBuffer();
      return res.contentType("png").send(image_png_buff);
    } catch (err) {
      const image = sharp(`uploads/${filename}`);
      const image_png = image.png();
      const thumbnail = await generate_thumbnail(image_png, filename);
      res.contentType("png").send(thumbnail);
    }
  } else {
    const image = sharp(`uploads/${filename}`);
    const image_png = image.png();
    try {
      const size = thumbnail && (parseInt(thumbnail.toString()));
      if (size) {
        const image_resized = image.resize(size, size, { fit: "inside" });
        const image_png_resized = image_resized.png();
        const image_png_resized_buff = await image_png_resized.toBuffer();
        return res.contentType("png").send(image_png_resized_buff);
      }
    } catch (err) {
      console.error("Error resizing image", err);
    }
    const image_png_buffer = await image_png.toBuffer();
    res.contentType("png").send(image_png_buffer);
  }
});

export const delete_avatar = asyncErrorHandler(async (req, res, next) => {
  const filename = req.body.user_id;

  if (!filename) {
    return next(new CustomError("Relogin to proceed with this request!", StatusCode.BAD_REQUEST));
  }

  try {
    delete_image_fs(filename);
  } catch (err) {
    const e = new CustomError("Error deleting image", StatusCode.INTERNAL_SERVER_ERROR);
    return next(e);
  }
});

// may throw error if file not found
const delete_image_fs = async (filename: string) => {
  console.log("Deleting image", filename);
  try {
    await unlink(`thumbnails/${filename}`);
  } catch {
    console.log("No thumbnail found for image");
  }
  await unlink(`uploads/${filename}`);
};

export const delete_image = asyncErrorHandler(async (req, res, next) => {
  const { filename } = req.params;

  if (!filename) {
    return next(new CustomError("Filename is required", StatusCode.BAD_REQUEST));
  }

  try {
    delete_image_fs(filename);
  } catch (err) {
    const e = new CustomError("Error deleting image", StatusCode.INTERNAL_SERVER_ERROR);
    return next(e);
  }

  res.status(200).json({
    success: true,
    message: "Image deleted successfully",
  });
});

export const update_image = asyncErrorHandler(async (req, res, next) => {
  const req_file = req.file;
  if (!req_file) {
    const err = new CustomError("Please upload an image and with a proper extension", StatusCode.BAD_REQUEST);
    return next(err);
  }
  const { filename } = req.params;

  if (!filename) {
    return next(new CustomError("Filename to be updated is required", StatusCode.BAD_REQUEST));
  }
  // check if thumbnail exists and update it if it does
  const thumbnail_path = `thumbnails/${filename}`;
  await unlink(thumbnail_path).then(() => generate_thumbnail(sharp(req_file.path), filename)).catch(() => console.log("No thumbnail found for image, hence not updated", filename));

  res.status(200).json({
    success: true,
    message: "Image updated successfully",
    data: {
      name: req_file.filename,
    }
  });
});