import mongoose from "mongoose";
import CustomError from "../../config/CustomError";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import StatusCode from "../helpers/httpStatusCode";
import { Blog, BlogStatus } from "../models/blogModel";
import { IUser } from "../models/userModel";
import { blogForApprovalMail } from "../helpers/emailHelper";

export const getMyBlogController = asyncErrorHandler(async (req, res, next) => {
  const user_id = new mongoose.Types.ObjectId(req.body.user_id);
  const { id } = req.params;

  const blog = await Blog.findById({
    _id: new mongoose.Types.ObjectId(id),
    user: user_id,
  })
    .populate<{ user: IUser }>("user", "_id name email")
    .lean();

  if (!blog) {
    return next();
  }

  res.status(StatusCode.OK).json({
    status: "success",
    message: "Blog fetched successfully",
    data: blog,
  });
});

export const getPublishedBlogsController = asyncErrorHandler(
  async (req, res, next) => {
    const blogs = await Blog.find({ status: BlogStatus.Published }, "-body")
      .populate<{ user: IUser }>("user", "_id name email")
      .sort({ created_at: -1 })
      .lean();

    if (!blogs || blogs.length === 0) {
      const error = new CustomError("No blogs found", StatusCode.NOT_FOUND);
      return next(error);
    }

    return res.status(StatusCode.OK).json({
      status: "success",
      message: "Blogs fetched successfully",
      data: blogs,
    });
  }
);

export const getBlogController = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const blog = await Blog.findById({ _id: new mongoose.Types.ObjectId(id) })
    .populate<{ user: IUser }>("user", "_id name email")
    .lean();

  if (!blog) {
    const error = new CustomError("Blog not found", StatusCode.NOT_FOUND);
    return next(error);
  }

  res.status(StatusCode.OK).json({
    status: "success",
    message: "Blog fetched successfully",
    data: blog,
  });
});

export const myBlogsController = asyncErrorHandler(async (req, res, next) => {
  const user_id = new mongoose.Types.ObjectId(req.body.user_id);
  const blogs = await Blog.find({ user: user_id }, "-body")
    .populate<{ user: IUser }>("user", "_id name email")
    .sort({ created_at: -1 })
    .lean();

  if (!blogs || blogs.length === 0) {
    const error = new CustomError("No blogs found", StatusCode.NOT_FOUND);
    return next(error);
  }

  res.status(StatusCode.OK).json({
    status: "success",
    message: "Blogs fetched successfully",
    data: blogs,
  });
});

/**
 * Get all blogs which are not draft. (Pending, Approved, Published blogs only)
 * @returns {Object} - Returns a JSON object containing the retrieved blogs.
 */
export const getAllBlogsController = asyncErrorHandler(
  async (req, res, next) => {
    await refresh_blog_status();
    const blogs = await Blog.find(
      { status: { $ne: BlogStatus.Draft } },
      "-body"
    )
      .populate<{ user: IUser }>("user", "_id name email")
      .sort({ created_at: -1 })
      .lean();

    if (!blogs || blogs.length === 0) {
      const error = new CustomError("No blogs found", StatusCode.NOT_FOUND);
      return next(error);
    }

    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blogs fetched successfully",
      data: blogs,
    });
  }
);

/**
 * Create a new blog.
 * @returns {Object} - Returns a JSON object confirming the creation of the blog.
 */
export const createBlogController = asyncErrorHandler(
  async (req, res, next) => {
    const requiredFields = [
      "title",
      "byliner",
      "slug",
      "body",
      "category_id",
      "meta_title",
      "meta_description",
      "user_id",
    ];
    // the condition !req.body[field] failed for category_id = 0
    const missingField = requiredFields.find(
      (field) => req.body[field] === undefined || req.body[field] === null
    );
    // umm ok we allow empty strings here, but ok itna dimag kon lagata hai

    if (missingField) {
      const error = new CustomError(
        `Please enter ${missingField.replace("_", " ")}`,
        StatusCode.BAD_REQUEST
      );
      return next(error);
    }

    // todo: we didn't verify if user who sent the request sent their user_id only
    // this can potentially allow user to publish blog with other's name
    // but who and why someone will do that so let's keep it the way it is
    const user_id = new mongoose.Types.ObjectId(req.body.user_id);
    let status: BlogStatus = req.body.status;
    if (
      !status ||
      status === BlogStatus.Published ||
      status === BlogStatus.Approved
    ) {
      status = BlogStatus.Draft;
    }

    const newBlogData = {
      ...req.body,
      user: user_id,
      status: status,
    };

    const blog = new Blog(newBlogData);
    await blog.save();

    res.status(StatusCode.OK).json({
      status: "success",
      message:
        status === BlogStatus.Draft
          ? "Blog saved as draft successfully"
          : "Blog created successfully",
      data: blog,
    });
  }
);

/**
 * Update a blog by ID.
 * @returns {Object} - Returns a JSON object containing the updated blog.
 */
export const updateBlogController = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const supplied_status = req.body.status;
    
    if (typeof supplied_status !== "number") {
      req.body.status = BlogStatus.Draft;
    } else if (supplied_status === BlogStatus.Published || supplied_status === BlogStatus.Approved || supplied_status === BlogStatus.Pending) {
      req.body.status = BlogStatus.Pending;
    } else {
      req.body.status = BlogStatus.Draft;
    }

    const blog = await Blog.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), status: BlogStatus.Draft },
      { ...req.body },
      { new: true , runValidators: true}
    );

    if (!blog) {
      const error = new CustomError(
        "Blog not found. Only drafts can be updated.",
        StatusCode.NOT_FOUND
      );
      return next(error);
    }

    if (blog.status == BlogStatus.Pending) {
      res.status(StatusCode.OK).json({
        status: "success",
        message: "Blog submitted for approval!",
        data: blog,
      });
      res.end();
      blogForApprovalMail(blog);
    } else {
      res.status(StatusCode.OK).json({
        status: "success",
        message: "Blog updated successfully!",
        data: blog,
      });
    }
  }
);

/**
 * Publish a blog by ID.
 * @returns {Object} - Returns a JSON object confirming the published blog.
 */
export const publishBlogController = asyncErrorHandler(
  async (req, res, _next) => {
    const { id } = req.params;
    const currentDate = new Date();
    const updatedBlog = await Blog.findByIdAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        status: BlogStatus.Published,
        published_at: currentDate, // Set the published_at field to the current date/time
      },
      { new: true }
    );

    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog published successfully",
      data: updatedBlog,
    });
  }
);

/**
 * Approves a blog by updating its status to "Approved" and setting the published_at field to the current date/time.
 * This implements posting blogs with a future publish timestamp.
 *
 * If the provided id or time is invalid, it returns a 400 error.
 * If the publish timestamp is in the past, it returns a 418 error (I'm a teapot).
 *
 * @function
 * @returns {Object} The updated blog object in the response.
 */
export const approveBlogController = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const { time } = req.body;
    if (!id || !time) {
      const error = new CustomError("Invalid request", StatusCode.BAD_REQUEST);
      return next(error);
    }
    const publish_timestamp = new Date(time);
    if (!publish_timestamp) {
      const error = new CustomError(
        "Invalid request! Time couldn't be parsed",
        StatusCode.BAD_REQUEST
      );
      return next(error);
    }
    const currentDate = new Date();
    if (currentDate > publish_timestamp) {
      // i am a teapot
      const error = new CustomError(
        "You can't change the past buddy, that's how life is. The puslish timings should be somewhere in the future.",
        StatusCode.IM_A_TEAPOT
      );
      return next(error);
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        status: BlogStatus.Approved,
        published_at: publish_timestamp, // Set the published_at field to the current date/time
      },
      { new: true }
    );
    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog will soon be published",
      data: updatedBlog,
    });
  }
);

/**
 * Refreshes the status of a blog. Makes the blog with status "Approved" and publish date in the past to "Published".
 *
 * @function
 * @returns {Object} A JSON response indicating the success of the operation.
 */
export const refreshBlogStatus = asyncErrorHandler(async (_req, res, _next) => {
  const updation = await refresh_blog_status();
  res.status(StatusCode.OK).json({
    status: "success",
    message: "Blog status refreshed successfully",
    data: updation,
  });
});

/**
 * Refreshes the status of blogs from "Approved" to "Published" if their publish date has passed.
 * @returns A promise that resolves to an object representing the result of the update operation.
 */
async function refresh_blog_status(): Promise<
  import("mongoose").UpdateWriteOpResult
> {
  const refresh_result = await Blog.updateMany(
    { status: BlogStatus.Approved, published_at: { $lte: new Date() } },
    { status: BlogStatus.Published }
  );
  if (refresh_result.matchedCount > 0) {
    console.log("Auto published blogs", refresh_result);
  }
  return refresh_result;
}

export const submitForApprovalController = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const updatedBlog = await Blog.findByIdAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        status: BlogStatus.Pending,
      },
      { new: true }
    );

    if (!updatedBlog) {
      const error = new CustomError(
        "Blog not found! Must have been deleted.",
        StatusCode.NOT_FOUND
      );
      return next(error);
    }

    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog submitted for approval",
      data: updatedBlog,
    });
    blogForApprovalMail(updatedBlog);
  }
);

export const deleteMyBlogController = asyncErrorHandler(
  async (req, res, next) => {
    const user_id = new mongoose.Types.ObjectId(req.body.user_id);
    const { id } = req.params;
    const blog = await Blog.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      user: user_id,
    });

    if (!blog) {
      return next();
    }

    console.log("Draft deleted", blog);

    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog deleted successfully",
      data: blog,
    });
  }
);

export const deleteBlogController = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const blog = await Blog.findByIdAndDelete({
      _id: new mongoose.Types.ObjectId(id),
    });

    if (!blog) {
      const error = new CustomError("Blog not found", StatusCode.NOT_FOUND);
      return next(error);
    }

    console.log("Blog deleted", blog);

    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog deleted successfully",
      data: blog,
    });
  }
);

export const takeDownBlogController = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const blog = await Blog.findByIdAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { status: BlogStatus.Draft },
      { new: true }
    );

    if (!blog) {
      const error = new CustomError("Blog not found", StatusCode.NOT_FOUND);
      return next(error);
    }

    console.log("Blog taken down", blog);

    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog taken down successfully",
      data: blog,
    });
  }
);
