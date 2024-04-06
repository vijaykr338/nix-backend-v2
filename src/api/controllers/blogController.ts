import mongoose from "mongoose";
import CustomError from "../../config/CustomError";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import StatusCode from "../helpers/httpStatusCode";
import { Blog, BlogStatus, IBlog } from "../models/blogModel";
import { IUser } from "../models/userModel";
import { blogForApprovalMail, blogPublishedMail } from "../helpers/emailHelper";
import fs from "node:fs";

export const getPersonalLevelBlog = asyncErrorHandler(
  async (req, res, next) => {
    const user_id = new mongoose.Types.ObjectId(req.body.user_id);
    const { id } = req.params;

    await refresh_blog_status();
    const blog = await Blog.findById({
      _id: new mongoose.Types.ObjectId(id),
    })
      .populate<{ user: IUser }>("user", "_id name email bio")
      .lean();

    if (!blog) {
      return next();
    }

    if (!user_id.equals(blog.user._id) && blog.status == BlogStatus.Draft) {
      const error = new CustomError(
        "This blog does not belongs to you",
        StatusCode.NOT_FOUND,
      );
      return next(error);
    }

    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog fetched successfully",
      data: blog,
    });
  },
);

export const getPublishedBlogsController = asyncErrorHandler(
  async (req, res, _next) => {
    await refresh_blog_status();
    const blogs = await Blog.find({ status: BlogStatus.Published }, "-body")
      .populate<{ user: IUser }>("user", "_id name email bio")
      .sort({ published_at: -1 })
      .lean();

    // this is not an error, but simply blogs = []
    // if (!blogs || blogs.length === 0) {
    //   const error = new CustomError("No blogs found", StatusCode.NOT_FOUND);
    //   return next(error);
    // }

    return res.status(StatusCode.OK).json({
      status: "success",
      message: "Blogs fetched successfully",
      data: blogs,
    });
  },
);

export const getPublishedBlogController = asyncErrorHandler(
  async (req, res, next) => {
    await refresh_blog_status();
    const { slug } = req.params;

    const blog = await Blog.findOne({ slug: slug })
      .populate<{ user: IUser }>("user", "_id name email bio")
      .lean();

    if (!blog || blog.status !== BlogStatus.Published) {
      const error = new CustomError("Blog not found", StatusCode.NOT_FOUND);
      return next(error);
    }

    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog fetched successfully",
      data: blog,
    });
  },
);

export const getBlogController = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const blog = await Blog.findById({ _id: new mongoose.Types.ObjectId(id) })
    .populate<{ user: IUser }>("user", "_id name email bio")
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

export const myBlogsController = asyncErrorHandler(async (req, res, _next) => {
  await refresh_blog_status();
  const user_id = new mongoose.Types.ObjectId(req.body.user_id);
  const blogs = await Blog.find({ user: user_id }, "-body")
    .populate<{ user: IUser }>("user", "_id name email bio")
    .sort({ updatedAt: -1 })
    .lean();

  // this is not an error, but simply blogs = []
  // if (!blogs || blogs.length === 0) {
  //   const error = new CustomError("No blogs found", StatusCode.NOT_FOUND);
  //   return next(error);
  // }

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
      "-body",
    )
      .populate<{ user: IUser }>("user", "_id name email bio")
      .sort({ updatedAt: -1 })
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
  },
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
      (field) => req.body[field] === undefined || req.body[field] === null,
    );
    // umm ok we allow empty strings here, but ok itna dimag kon lagata hai

    if (missingField) {
      const error = new CustomError(
        `Please enter ${missingField.replace("_", " ")}`,
        StatusCode.BAD_REQUEST,
      );
      return next(error);
    }

    // todo: we didn't verify if user who sent the request sent their user_id only
    // this can potentially allow user to publish blog with other's name
    // but who and why someone will do that so let's keep it the way it is
    const user_id = new mongoose.Types.ObjectId(req.body.user_id);
    const supplied_status: BlogStatus = req.body.status;

    if (typeof supplied_status !== "number") {
      req.body.status = BlogStatus.Draft;
    } else if (
      supplied_status === BlogStatus.Published ||
      supplied_status === BlogStatus.Approved ||
      supplied_status === BlogStatus.Pending
    ) {
      req.body.status = BlogStatus.Pending;
    } else {
      req.body.status = BlogStatus.Draft;
    }

    const newBlogData = {
      ...req.body,
      user: user_id,
    };

    const blog = new Blog(newBlogData);
    await blog.save();

    if (blog.status === BlogStatus.Pending) {
      blogForApprovalMail(blog);
    }

    res.status(StatusCode.OK).json({
      status: "success",
      message:
        req.body.status === BlogStatus.Draft
          ? "Blog saved as draft successfully"
          : "Blog created successfully",
      data: blog,
    });
  },
);

export const updateBlogController = asyncErrorHandler(
  async (req, res, next) => {
    const blog = req.body.blog as IBlog;

    const updated_blog = await blog.updateOne(req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated_blog) {
      const error = new CustomError(
        "Some error occured! Blog not updated.",
        StatusCode.INTERNAL_SERVER_ERROR,
      );
      return next(error);
    }

    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog updated successfully!",
      data: updated_blog,
    });
  },
);

/**
 * Update a blog by ID.
 * @returns {Object} - Returns a JSON object containing the updated blog.
 */
export const updateDraftController = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const supplied_status = req.body.status;
    const blog = await Blog.findById({ _id: new mongoose.Types.ObjectId(id) });

    if (!blog) {
      const error = new CustomError(
        "Specified blog not found. Maybe it was deleted?",
        StatusCode.NOT_FOUND,
      );
      return next(error);
    }

    if (blog.status !== BlogStatus.Draft) {
      req.body.blog = blog;
      console.log(
        "Blog is not a draft, needs god like permission to edit!",
        BlogStatus[blog.status],
        blog._id,
      );
      return next();
    }

    if (typeof supplied_status !== "number") {
      req.body.status = BlogStatus.Draft;
    } else if (
      supplied_status === BlogStatus.Published ||
      supplied_status === BlogStatus.Approved ||
      supplied_status === BlogStatus.Pending
    ) {
      req.body.status = BlogStatus.Pending;
    } else {
      req.body.status = BlogStatus.Draft;
    }

    if (!blog) {
      const error = new CustomError(
        "Blog not found. Only drafts can be updated.",
        StatusCode.NOT_FOUND,
      );
      return next(error);
    }

    const updated_blog = await blog.updateOne(req.body, {
      new: true,
      runValidators: true,
    });

    if (updated_blog.status == BlogStatus.Pending) {
      res.status(StatusCode.OK).json({
        status: "success",
        message: "Blog submitted for approval!",
      });
      res.end();
      blogForApprovalMail(blog);
    } else {
      res.status(StatusCode.OK).json({
        status: "success",
        message: "Blog updated successfully!",
      });
    }
  },
);

/**
 * Publish a blog by ID.
 * @returns {Object} - Returns a JSON object confirming the published blog.
 */
export const publishBlogController = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const currentDate = new Date();
    const updatedBlog = await Blog.findByIdAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        status: BlogStatus.Published,
        published_at: currentDate, // Set the published_at field to the current date/time
      },
      { new: true },
    );

    if (!updatedBlog) {
      const error = new CustomError(
        "Blog to publish was not found!",
        StatusCode.NOT_FOUND,
      );
      return next(error);
    }

    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog published successfully",
      data: updatedBlog,
    });

    blogPublishedMail(updatedBlog);
  },
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
        StatusCode.BAD_REQUEST,
      );
      return next(error);
    }
    const currentDate = new Date();
    if (currentDate > publish_timestamp) {
      // i am a teapot
      console.log(
        "Publish time is in the past",
        publish_timestamp,
        currentDate,
        req.body,
      );
      const error = new CustomError(
        "You can't change the past buddy, that's how life is. The publish timings should be somewhere in the future.",
        StatusCode.IM_A_TEAPOT,
      );
      return next(error);
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        status: BlogStatus.Approved,
        published_at: publish_timestamp, // Set the published_at field to the current date/time
      },
      { new: true },
    );
    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog will soon be published",
      data: updatedBlog,
    });
  },
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
  const blogsToPublish = await Blog.find({
    status: BlogStatus.Approved,
    published_at: { $lte: new Date() },
  });

  const blogIds = blogsToPublish.map((blog) => blog._id);

  const refresh_result = await Blog.updateMany(
    { _id: { $in: blogIds }, status: BlogStatus.Approved },
    { status: BlogStatus.Published },
  );

  if (refresh_result.matchedCount > 0 && refresh_result.modifiedCount > 0) {
    console.log("Auto published blogs; count =", refresh_result);
    console.log("IDs of autopublished blogs", blogIds);
    blogsToPublish.forEach((blog) => blogPublishedMail(blog));
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
      { new: true },
    );

    if (!updatedBlog) {
      const error = new CustomError(
        "Blog not found! Must have been deleted.",
        StatusCode.NOT_FOUND,
      );
      return next(error);
    }

    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog submitted for approval",
      data: updatedBlog,
    });
    blogForApprovalMail(updatedBlog);
  },
);

export const deleteMyBlogController = asyncErrorHandler(
  async (req, res, next) => {
    const user_id = new mongoose.Types.ObjectId(req.body.user_id);
    const { id } = req.params;
    const blog = await Blog.findOne({
      _id: new mongoose.Types.ObjectId(id),
      user: user_id,
    });

    if (!blog) {
      const err = new CustomError("Blog not found", StatusCode.NOT_FOUND);
      return next(err);
    }
    if (blog.status != BlogStatus.Draft) {
      return next();
    }
    await blog.deleteOne();
    console.log("Draft deleted", blog);

    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog deleted successfully",
      data: blog,
    });

    if (blog.cover) {
      fs.unlink(`uploads/${blog.cover}`, (err) => {
        if (err) {
          console.error("Deleting blog image failed", err, blog._id);
          return;
        }
        console.log("Image deleted for deleted blog");
      });
      fs.unlink(`thumbnail/${blog.cover}`, (err) => {
        if (err) {
          console.error("Deleting blog thumbnail failed", err, blog._id);
          return;
        }
        console.log("Thumbnail deleted for deleted blog");
      });
    }
  },
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

    if (blog.cover) {
      fs.unlink(`uploads/${blog.cover}`, (err) => {
        if (err) {
          console.error("Deleting blog image failed", err, blog._id);
          return;
        }
        console.log("Image deleted for deleted blog");
      });
      fs.unlink(`thumbnail/${blog.cover}`, (err) => {
        if (err) {
          console.error("Deleting blog thumbnail failed", err, blog._id);
          return;
        }
        console.log("Thumbnail deleted for deleted blog");
      });
    }
  },
);

export const takeDownMyBlogController = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const blog = await Blog.findById(
      // this implies user submitted blog accidentally and wants to take it down
      { _id: new mongoose.Types.ObjectId(id) },
    );

    if (!blog) {
      const error = new CustomError("Blog not found", StatusCode.NOT_FOUND);
      return next(error);
    }

    if (
      new mongoose.Types.ObjectId(blog.user.toString()).equals(req.body.user_id)
    ) {
      // user can take down their own blog
      blog.status = BlogStatus.Draft;
      await blog.save();
    } else {
      req.body.blog = blog;
      return next();
    }

    console.log("Blog taken down", blog);

    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog taken down successfully",
      data: blog,
    });
  },
);

export const takeDownBlogController = asyncErrorHandler(
  async (req, res, _next) => {
    const blog = req.body.blog;
    blog.status = BlogStatus.Draft;
    await blog.save();

    console.log("Blog taken down", blog);
    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog taken down successfully",
      data: blog,
    });
  },
);
