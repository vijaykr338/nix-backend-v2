import fs from "fs";
import { spawn } from "node:child_process";
import sharp, { FitEnum } from "sharp";
import util from "util";
import CustomError from "../../config/CustomError";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import StatusCode from "../helpers/httpStatusCode";
import {
  DeleteImageOptions,
  GenerateThumbnailOptions,
  ThumbnailOptions,
  dimension_map,
} from "../helpers/imageOptions";
import { ImageType } from "../middlewares/imageMiddleware";
import { assertProtectedUser } from "../helpers/assertions";

const writeFile = util.promisify(fs.writeFile);

/** Throws CustomError if image not found */
const get_thumbnail = async ({
  og_filename: filename,
  image_type,
  thumbnail_type,
}: ThumbnailOptions) => {
  const dimension =
    thumbnail_type === "true"
      ? dimension_map(image_type)
      : (thumbnail_type && parseInt(thumbnail_type)) ||
        dimension_map(image_type);

  const thumnail_query = `${filename}_${dimension}`;

  try {
    const img = sharp(`thumbnails/${thumnail_query}`);
    const img_buff = await img.toBuffer();
    return img_buff;
  } catch {
    // requested thumbnail doesn't exists
    if (
      image_type === ImageType.Avatar &&
      !fs.existsSync(`uploads/${filename}`)
    ) {
      // thumbnail for avatar is requested, which doesn't exists
      const default_avatar = sharp("thumbnails/default-avatar.png");
      return default_avatar.toBuffer();
    }

    if (image_type !== ImageType.Avatar) {
      console.error(
        "Non existing thumbnail requested".red,
        thumnail_query.yellow,
        "Generating new one".cyan,
      );
    }

    try {
      const img_buff = await generate_thumbnail(
        sharp(`uploads/${filename}`),
        filename,
        {
          image_type,
          image_dimensions: dimension,
        },
      );
      return img_buff;
    } catch {
      const err = new CustomError("Image not found", StatusCode.NOT_FOUND);
      throw err;
    }
  }
};

const generate_thumbnail = async (
  image: sharp.Sharp,
  filename: string,
  { image_type, image_dimensions = 256 }: GenerateThumbnailOptions = {
    image_dimensions: 256,
    image_type: ImageType.General,
  },
) => {
  if (image_type != undefined && image_dimensions != undefined) {
    console.log(
      "Both image_type and image_dimensions are provided, image_dimensions will be used for dimensions",
    );
  }

  if (image_type !== ImageType.Avatar) {
    console.log("Creating thumbnail for", filename);
  }

  const dimension = image_dimensions || dimension_map(image_type);

  const fit = ((): keyof FitEnum => {
    switch (image_type) {
      case ImageType.Avatar:
        return "cover";
      case ImageType.Edition:
        return "inside";
      case ImageType.General:
        return "inside";
      default:
        return "inside";
    }
  })();

  const thumbnail = await image
    .resize(dimension, dimension, { fit: fit })
    .toBuffer();

  writeFile(`thumbnails/${filename}_${dimension}`, thumbnail)
    .then(() => {
      if (image_type !== ImageType.Avatar)
        console.log(
          "Thumbnail created successfully for file with given dimension",
          filename.cyan,
          dimension,
        );
    })
    .catch((err) => {
      if (image_type !== ImageType.Avatar)
        console.error(
          "Error creating thumbnail",
          filename.cyan,
          dimension,
          err,
        );
    });
  return thumbnail;
};

/**
 * @description Handles the upload of an image file.
 * @route POST /upload
 * @param req - The HTTP request object.
 * @param req.file - The uploaded image file.
 * @param req.query.thumbnail - Optional query parameter indicating if the uploaded image is a thumbnail.
 * @param req.body.image_type - Optional body parameter specifying the type of the image (e.g., General, Profile).
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns success - Indicates the success status of the operation (true).
 * @returns message - Describes the outcome of the operation ('Image uploaded successfully').
 * @returns data - Contains details of the uploaded image.
 * @howItWorks
 * - Validates the presence of the uploaded image file (`req.file`).
 * - Optionally generates a thumbnail if `req.query.thumbnail` is set to "true".
 * - Sets the image type based on `req.body.image_type` or defaults to `ImageType.General`.
 * - Sends a success response with the uploaded image filename upon successful upload.
 * - Handles errors if the upload fails or required parameters are missing.
 */

export const upload_image = asyncErrorHandler(async (req, res, next) => {
  const req_file = req.file;
  const is_thumbnail = req.query.thumbnail === "true";
  const image_type = (req.body.image_type as ImageType) || ImageType.General;
  console.log("Image type", image_type);

  if (!req_file) {
    const err = new CustomError(
      "Please upload an image and with a proper extension",
      StatusCode.BAD_REQUEST,
    );
    return next(err);
  }

  console.log("Uploading image", req_file);
  const image = sharp(req_file.path);
  const image_png = image.png();
  if (is_thumbnail) {
    await generate_thumbnail(image_png, req_file.filename, {
      image_type: image_type,
      image_dimensions: dimension_map(image_type),
    });

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        name: req_file.filename,
      },
    });
  }

  res.status(201).json({
    success: true,
    message: "Image uploaded successfully",
    data: {
      name: req_file.filename,
    },
  });
});

/**
 * @description Retrieves an avatar image for a user based on the filename.
 * @route GET /get-avatar/:id
 * @param req - The HTTP request object.
 * @param req.params.id - The filename or user ID of the avatar image to retrieve.
 * @param req.query.thumbnail - Optional query parameter indicating if a thumbnail version of the avatar is requested.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns Returns the avatar image or its thumbnail as a PNG buffer.
 * @howItWorks
 * - Retrieves the filename (`req.params.id`) of the avatar image to fetch.
 * - Optionally fetches a thumbnail version if `req.query.thumbnail` is provided.
 * - Responds with the avatar image in PNG format.
 * - Defaults to a default avatar image if no avatar is found for the specified user.
 * - Handles errors and sends appropriate error responses if the avatar retrieval fails.
 */

export const get_avatar = asyncErrorHandler(async (req, res, next) => {
  const filename = req.params.id;
  const { thumbnail } = req.query;

  if (!filename) {
    const err = new CustomError("UserID is required", StatusCode.BAD_REQUEST);
    return next(err);
  }

  if (thumbnail) {
    const img_buff = await get_thumbnail({
      og_filename: filename,
      image_type: ImageType.Avatar,
      thumbnail_type: thumbnail.toString(),
    });
    return res.contentType("image/png").send(img_buff);
  }

  try {
    const img = sharp(`uploads/${filename}`);
    const img_buff = await img.png().toBuffer();
    res.contentType("png").send(img_buff);
  } catch {
    console.error("No avatar found for user", filename);
    const image = sharp("uploads/default-avatar.png");
    const img = await image.toBuffer();
    res.contentType("png").send(img);
  }
});

/**
 * @description Retrieves an image file based on the filename.
 * @route GET /get/:filename
 * @param req - The HTTP request object.
 * @param req.params.filename - The filename of the image to retrieve.
 * @param req.query.thumbnail - Optional query parameter indicating if a thumbnail version of the image is requested.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns Returns the requested image or its thumbnail as a PNG buffer.
 * @howItWorks
 * - Retrieves the filename (`req.params.filename`) of the image to fetch.
 * - Optionally fetches a thumbnail version if `req.query.thumbnail` is provided.
 * - Responds with the image in PNG format.
 * - Defaults to sending an error response if the image is not found.
 */

export const get_image = asyncErrorHandler(async (req, res, next) => {
  const { filename: file } = req.params;
  const filename = file.split("?")[0];
  const { thumbnail } = req.query;

  if (!filename) {
    const err = new CustomError("UserID is required", StatusCode.BAD_REQUEST);
    return next(err);
  }

  if (thumbnail) {
    // not empty string and not undefined
    const img_buff = await get_thumbnail({
      og_filename: filename,
      image_type: (req.body.image_type as ImageType) || ImageType.General,
      thumbnail_type: thumbnail.toString(),
    });
    return res.contentType("png").send(img_buff);
  } else {
    try {
      const image = sharp(`uploads/${filename}`);
      const img_buff = await image.png().toBuffer();
      res.contentType("png").send(img_buff);
    } catch {
      const err = new CustomError("Image not found", StatusCode.NOT_FOUND);
      return next(err);
    }
  }
});

/**
 * @description Deletes the avatar image associated with the current user.
 * @route DELETE /delete-avatar
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns success - Indicates the success status of the operation (true).
 * @returns message - Describes the outcome of the operation ('Avatar deleted successfully').
 * @howItWorks
 * - Ensures the user making the request is authenticated and has permissions to delete their avatar.
 * - Retrieves the filename (`res.locals.user_id`) of the avatar to delete.
 * - Calls a function (`delete_image_fs`) to delete the image from the filesystem.
 * - If the filename is not found, returns a `BAD_REQUEST` error indicating the user needs to re-login.
 */

export const delete_avatar = asyncErrorHandler(async (req, res, next) => {
  assertProtectedUser(res);
  const filename = res.locals.user_id.toString();

  if (!filename) {
    return next(
      new CustomError(
        "Relogin to proceed with this request!",
        StatusCode.BAD_REQUEST,
      ),
    );
  }

  delete_image_fs(filename);
});

const delete_image_fs = (
  filename: string,
  { only_thumbnail }: DeleteImageOptions = { only_thumbnail: false },
) => {
  // filter non-alphanumeric characters
  // constraint from image middleware
  filename = filename.replace(/[^a-z0-9_.]/g, "");
  console.log("Deleting image".red, filename.red);
  const thumbnail_path = `thumbnails/${filename}_*`;
  const upload_path = `uploads/${filename}`;

  // security warning: Any input containing shell metacharacters may be used to trigger arbitrary command execution
  // so i cleaned filename beforehand
  const delete_path = [thumbnail_path, upload_path];
  if (only_thumbnail) {
    // delete only thumbnail
    delete_path.pop();
  }

  // directly using rm doesn't work because globbing is shell provided feature and rm expects exact file name match
  // const child = spawn("rm", ["-f", ...delete_path]);

  const bash_args = [
    "-c",
    "shopt -s extglob\nshopt -s nullglob\nrm -f " + delete_path.join(" "),
  ];
  const child = spawn("bash", bash_args);

  /* child.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });
  child.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  }); */

  child.once("close", (code) => {
    console.log(`Delete image process exited with code ${code}`);
  });
  child.once("error", () => {
    console.error("Failed to start subprocess.");
  });
  return child;
};

/**
 * @description Deletes an image from the filesystem.
 * @route DELETE /delete/:filename
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns success - Indicates the success status of the operation (true).
 * @returns message - Describes the outcome of the operation ('Image deleted successfully').
 * @howItWorks
 * - Retrieves the filename (`filename`) of the image to delete from the request parameters.
 * - Deletes the image using a function (`delete_image_fs`) that interacts with the filesystem.
 * - Sends a success response indicating the image was deleted.
 * - If no filename is provided, returns a `BAD_REQUEST` error.
 */

export const delete_image = asyncErrorHandler(async (req, res, next) => {
  const { filename } = req.params;

  if (!filename) {
    return next(
      new CustomError("Filename is required", StatusCode.BAD_REQUEST),
    );
  }

  delete_image_fs(filename);

  res.status(200).json({
    success: true,
    message: "Image deleted successfully",
  });
});

/**
 * @description Updates an image file in the filesystem.
 * @route PUT /update/:filename
 * @param req - The HTTP request object containing the updated image file (`req.file`).
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns success - Indicates the success status of the operation (true).
 * @returns message - Describes the outcome of the operation ('Image updated successfully').
 * @returns data - Contains details of the updated image.
 * @howItWorks
 * - Retrieves the updated image file (`req.file`) from the request body.
 * - Deletes any existing thumbnail associated with the image (`filename`) using a child process.
 * - Waits for the deletion process to complete before sending a response.
 * - Sends a success response indicating the image was updated, including the new filename (`req_file.filename`).
 * - If no image file (`req.file`) is provided, returns a `BAD_REQUEST` error.
 * - If no filename is provided, returns a `BAD_REQUEST` error indicating the filename is required.
 * - Handles edge cases such as timeout during deletion process with appropriate logging and error handling.
 */

export const update_image = asyncErrorHandler(async (req, res, next) => {
  const req_file = req.file;
  if (!req_file) {
    const err = new CustomError(
      "Please upload an image and with a proper extension",
      StatusCode.BAD_REQUEST,
    );
    return next(err);
  }
  const { filename } = req.params;

  if (!filename) {
    return next(
      new CustomError(
        "Filename to be updated is required",
        StatusCode.BAD_REQUEST,
      ),
    );
  }
  // check if thumbnail exists and remove it
  const child = delete_image_fs(filename, { only_thumbnail: true });

  // wait for child process to complete with timeout of 1s
  // this ensures that res is sent only after updation or failing to update
  // in case update fails, which it never should... well, i didn't handle it.. pray to god that it all works out
  await new Promise<void>((resolve, reject) => {
    child.once("close", (code) => {
      console.log(`Update image deletion step exited with code ${code}`);
      resolve();
    });
    setTimeout(() => {
      console.error(
        "oh my god, update image handle panciked caz couldn't delete thumbnail in time! AAAAwaaaaaaa!",
      );
      reject("Child process timeout");
    }, 1000);
  });

  res.status(200).json({
    success: true,
    message: "Image updated successfully",
    data: {
      name: req_file.filename,
    },
  });
});
