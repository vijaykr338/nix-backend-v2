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
  const thumbnail = await image.resize(50, 50).toBuffer();
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

  console.log("Uploading image" , req_file);
  const image = sharp(req_file.path);
  const image_png = image.png();
  if (is_thumbnail) {
    const thumbnail = await generate_thumbnail(image_png, req_file.filename);

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        thumbnail: thumbnail.toString("base64"),
      }
    });
  }

  res.status(201).json({
    success: true,
    message: "Image uploaded successfully",
  });
  res.contentType("png").send(await image_png.toBuffer());
});

export const get_image = asyncErrorHandler(async (req, res, next) => {
  const { filename, thumbnail } = req.body;

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
  }
});

export const delete_image = asyncErrorHandler(async (req, res, next) => {
  const { filename } = req.body;

  if (!filename) {
    return next(new CustomError("Filename is required", StatusCode.BAD_REQUEST));
  }
  console.log("Deleting image", filename);

  try {
    await unlink(`thumbnails/${filename}`);
  } catch {
    console.log("No thumbnail found for image");
  }

  try {
    await unlink(`uploads/${filename}`);
  } catch (err) {
    return next(new CustomError("Error deleting image", StatusCode.INTERNAL_SERVER_ERROR));
  }

  res.status(200).json({
    success: true,
    message: "Image deleted successfully",
  });
});

// todo: Upadate an image in place
export const update_image = asyncErrorHandler(async (req, res, next) => {
  // not implemented
  const req_file = req.file;
  if(!req_file) {
    const err = new CustomError("Please upload an image and with a proper extension", StatusCode.BAD_REQUEST);
    return next(err);
  }
  const { filename } = req.params;

  if (!filename) {
    return next(new CustomError("Filename to be updated is required", StatusCode.BAD_REQUEST));
  }

  const image = sharp(req_file.path);
  const image_png = image.png();
  const thumbnail = await generate_thumbnail(image_png, filename);

  res.status(200).json({
    success: true,
    message: "Image updated successfully",
    data: {
      thumbnail: thumbnail.toString("base64"),
    }
  });
});