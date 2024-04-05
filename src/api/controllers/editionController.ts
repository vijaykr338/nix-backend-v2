import mongoose from "mongoose";
import CustomError from "../../config/CustomError";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import StatusCode from "../helpers/httpStatusCode";
import { Edition, EditionStatus } from "../models/editionModel";

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
