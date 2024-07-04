import mongoose from "mongoose";
import CustomError from "../../config/CustomError";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import StatusCode from "../helpers/httpStatusCode";
import { Edition, EditionStatus } from "../models/editionModel";

/**
 * @description Fetches all editions sorted by edition_id in descending order.
 * @route GET /
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Editions fetched successfully').
 * @returns data - Contains an array of fetched edition objects.
 * @howItWorks
 * - Calls `refresh_status()` to update the status of editions if necessary.
 * - Retrieves all editions from the `Edition` collection, sorted by `edition_id` in descending order.
 * - Checks if any editions are found. If not, it returns a "No editions found" error.
 * - Responds with the retrieved editions, or an error message if no editions are found.
 */

export const getAllEditions = asyncErrorHandler(async (req, res, next) => {
  await refresh_status();
  const editions = await Edition.find().sort({ edition_id: -1 });

  if (!editions || editions.length === 0) {
    const error = new CustomError("No editions found", StatusCode.NOT_FOUND);
    return next(error);
  }

  res.status(StatusCode.OK).json({
    status: "success",
    message: "Blogs fetched successfully",
    data: editions,
  });
});

/**
 * @description Fetches a specific edition by its ID.
 * @route GET /get-edition/:id
 * @param req - The HTTP request object.
 * @param req.params.id - The ID of the edition to fetch.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Edition fetched successfully').
 * @returns data - Contains the fetched edition object.
 * @howItWorks
 * - Extracts the edition ID from the request parameters.
 * - Searches the database for an edition with the given ID.
 * - If the edition is not found, throws a "Edition not found" error.
 * - If the edition is found, sends a success response with the edition data.
 */
export const getEdition = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const edition = await Edition.findOne({
    _id: new mongoose.Types.ObjectId(id),
  });

  if (!edition) {
    const error = new CustomError("Edition not found", StatusCode.NOT_FOUND);
    return next(error);
  }

  res.status(StatusCode.OK).json({
    status: "success",
    message: "Edition fetched successfully",
    data: edition,
  });
});

/**
 * @description Fetches all published editions.
 * @route GET /published-editions
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Editions fetched successfully').
 * @returns data - Contains an array of published edition objects.
 * @howItWorks
 * - Refreshes the status of editions by calling `refresh_status()`.
 * - Searches the database for editions with the status of "Published".
 * - Sorts the editions by `edition_id` in descending order.
 * - If no editions are found, throws a "No editions found" error.
 * - Sends a success response with the fetched editions data.
 */

export const getPublishedEditions = asyncErrorHandler(
  async (req, res, next) => {
    await refresh_status();
    const editions = await Edition.find({
      status: EditionStatus.Published,
    }).sort({
      edition_id: -1,
    });

    if (!editions || editions.length === 0) {
      const error = new CustomError("No editions found", StatusCode.NOT_FOUND);
      return next(error);
    }

    return res.status(StatusCode.OK).json({
      status: "success",
      message: "Blogs fetched successfully",
      data: editions,
    });
  },
);

/**
 * @description Deletes a specific edition.
 * @route DELETE /delete-edition/:id
 * @param req - The HTTP request object.
 * @param req.params - Contains the `id` of the edition to delete.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Edition deleted successfully').
 * @returns data - Contains the deleted edition object.
 * @howItWorks
 * - Retrieves the edition to delete by `id` from the request parameters.
 * - Throws an error if the edition is not found.
 * - Deletes the edition from the database.
 * - Logs the deletion of the edition along with the user's email.
 * - Sends a success response indicating the edition was deleted.
 */

export const deleteEdition = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const edition = await Edition.findByIdAndDelete({
    _id: new mongoose.Types.ObjectId(id),
  });

  if (!edition) {
    const error = new CustomError("Edition not found", StatusCode.NOT_FOUND);
    return next(error);
  }

  console.log("Edition deleted", edition, "by user", req.body.email);

  res.status(StatusCode.OK).json({
    status: "success",
    message: "Edition deleted successfully",
    data: edition,
  });
});

/**
 * @description Creates or updates an edition.
 * @route POST/PUT /create-edition
 * @param req - The HTTP request object.
 * @param req.body - Contains the details of the edition to create or update.
 * @param req.body.edition_name - The name of the edition.
 * @param req.body.edition_id - The ID of the edition.
 * @param req.body.edition_link - The link to the edition.
 * @param req.body.status - The status of the edition.
 * @param req.body.published_at - The publication date of the edition.
 * @param req.params - Contains the `id` of the edition to update (if any).
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Edition saved as draft successfully' or 'Edition posted successfully').
 * @returns data - Contains the updated or created edition object.
 * @howItWorks
 * - Validates the request body to ensure required fields are present.
 * - Sets the edition status and publication date based on the supplied status.
 * - If an `id` is provided, updates the existing edition.
 * - If no `id` is provided, creates a new edition.
 * - Throws an error if the edition is not found or an error occurs during the process.
 * - Sends a success response indicating the edition was created or updated.
 */
export const upsertEdition = asyncErrorHandler(async (req, res, next) => {
  const edition_name = req.body.edition_name;
  const edition_id = req.body.edition_id;
  const edition_obj_id = req.params.id;
  const edition_link = req.body.edition_link;

  if (!edition_name || !edition_id || !edition_link) {
    const error = new CustomError(
      "Please provide edition_name, edition_id and edition_link",
      StatusCode.BAD_REQUEST,
    );
    return next(error);
  }

  const supplied_status: EditionStatus = req.body.status;
  const published_at = req.body.published_at;
  if (typeof supplied_status !== "number") {
    req.body.status = EditionStatus.Draft;
  } else if (supplied_status === EditionStatus.Approved) {
    req.body.status = EditionStatus.Draft;
    const time = new Date(published_at);
    if (!published_at || !time) {
      const error = new CustomError(
        "Please provide published_at for approved edition",
        StatusCode.BAD_REQUEST,
      );
      return next(error);
    }
    req.body.published_at = time;
    if (time < new Date()) {
      req.body.status = EditionStatus.Published;
      req.body.published_at = new Date();
    }
  } else if (supplied_status === EditionStatus.Published) {
    req.body.status = EditionStatus.Published;
    req.body.published_at = new Date();
  } else {
    req.body.status = EditionStatus.Draft;
  }
  if (edition_obj_id) {
    const edition = await Edition.findByIdAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(edition_obj_id),
      },
      {
        name: edition_name,
        edition_id: edition_id,
        status: req.body.status,
        edition_link: edition_link,
        published_at:
          req.body.status === EditionStatus.Draft
            ? null
            : req.body.published_at,
      },
      {
        new: true,
        runValidators: true,
      },
    ).catch((e) => {
      const err = new CustomError(e);
      return next(err);
    });

    if (!edition) {
      const error = new CustomError("Edition not found", StatusCode.NOT_FOUND);
      return next(error);
    }

    return res.status(StatusCode.OK).json({
      status: "success",
      message:
        edition.status === EditionStatus.Draft
          ? "Edition saved as draft successfully"
          : "Edition posted successfully",
      data: edition,
    });
  }

  const edition = await Edition.create({
    name: edition_name,
    edition_id: edition_id,
    status: req.body.status,
    edition_link: edition_link,
    published_at:
      req.body.status === EditionStatus.Draft ? null : req.body.published_at,
  }).catch((e) => {
    const err = new CustomError(e);
    return next(err);
  });

  if (!edition) {
    const error = new CustomError("Edition not created! Some error occured");
    return next(error);
  }

  return res.status(StatusCode.OK).json({
    status: "success",
    message:
      edition.status === EditionStatus.Draft
        ? "Edition saved as draft successfully"
        : "Edition posted successfully",
    data: edition,
  });
});

/**
 * Refreshes the status of blogs from "Approved" to "Published" if their publish date has passed.
 * @returns A promise that resolves to an object representing the result of the update operation.
 */
async function refresh_status(): Promise<
  import("mongoose").UpdateWriteOpResult
> {
  const refresh_result = await Edition.updateMany(
    { status: EditionStatus.Approved, published_at: { $lte: new Date() } },
    { status: EditionStatus.Published },
  );
  if (refresh_result.matchedCount > 0) {
    console.log("Auto published editions", refresh_result);
  }
  return refresh_result;
}
