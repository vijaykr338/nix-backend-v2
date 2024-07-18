import mongoose, { HydratedDocument } from "mongoose";
import fs from "node:fs";
import CustomError from "../../config/CustomError";
import { assertProtectedUser } from "../helpers/assertions";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import { blogForApprovalMail, blogPublishedMail } from "../helpers/emailHelper";
import StatusCode from "../helpers/httpStatusCode";
import { Blog, BlogStatus, IBlog } from "../models/blogModel";
import { IUser } from "../models/userModel";

/**
 * @description Retrieves a specific blog post belonging to the authenticated user or checks draft status if not the owner.
 * @route GET /blogs/:id
 * @param req - The HTTP request object.
 * @param req.params - Parameters from the URL, including `id` which is the blog post ID.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response containing the fetched blog.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Blog fetched successfully').
 * @returns data - Contains the details of the fetched blog.
 * @howItWorks
 * - Asserts that the user accessing the route is authenticated and retrieves the user's ID from the response locals.
 * - Retrieves the `id` parameter from the request URL which represents the blog post ID.
 * - Calls `refresh_blog_status()` to update any blog statuses.
 * - Finds the blog post in the database based on its ID, populating the `user` field with specific user details (`_id`, `name`, `email`, `bio`).
 * - If the blog post is not found, it proceeds to the next middleware.
 * - If the blog post exists:
 *   - Checks if the user ID matches the blog's owner ID and ensures the blog status is not `Draft`.
 *   - If the blog does not belong to the authenticated user and is still a draft, it returns an error.
 *   - Otherwise, it returns a success response with the blog post data.
 */
export const getPersonalLevelBlog = asyncErrorHandler(
  async (req, res, next) => {
    assertProtectedUser(res);
    const user_id = res.locals.user_id;
    const { id } = req.params;

    await refresh_blog_status();
    const blog = await Blog.findById({
      _id: new mongoose.Types.ObjectId(id),
    })
      .populate<{ user: HydratedDocument<IUser> }>("user", "_id name email bio")
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

/**
 * @description Retrieves all published blogs, excluding their body content, sorted by published date in descending order.
 * @route GET /published-blogs
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 * @param _next - The next middleware function in the stack (not used).
 * @returns A JSON response containing the fetched blogs.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Blogs fetched successfully').
 * @returns data - Contains an array of published blogs with user details populated.
 * @howItWorks
 * - Calls `refresh_blog_status()` to update any blog statuses before querying.
 * - Queries the database for all blog posts with status 'Published', excluding their body content ('-body').
 * - Populates each blog post's `user` field with specific user details (`_id`, `name`, `email`, `bio`).
 * - Sorts the retrieved blogs by their `published_at` date in descending order (newest first).
 * - Returns a success response with the fetched blogs data.
 */
export const getPublishedBlogsController = asyncErrorHandler(
  async (req, res, _next) => {
    await refresh_blog_status();
    const blogs = await Blog.find({ status: BlogStatus.Published }, "-body")
      .populate<{ user: HydratedDocument<IUser> }>("user", "_id name email bio")
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

/**
 * Publish a blog by ID.
 * @returns - Returns a JSON object confirming the published blog.
 */
/**
 * @description Retrieves a published blog by its slug.
 * @route GET /get-published-blog/:slug
 * @param req - The HTTP request object.
 * @param req.params - Parameters from the URL, including `slug` which is the unique identifier for the blog post.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response containing the fetched blog.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Blog fetched successfully').
 * @returns data - Contains the details of the fetched blog.
 * @howItWorks
 * - Calls `refresh_blog_status()` to ensure the latest blog statuses are available.
 * - Retrieves the `slug` parameter from the request URL, which identifies the blog post.
 * - Searches the database for a blog post with the matching slug.
 * - Populates the `user` field of the blog post with details such as `_id`, `name`, `email`, and `bio`.
 * - If the blog post is not found or is not published, it generates a `NOT_FOUND` error.
 * - If the blog post is found and is published, it returns a success response with the blog post data.
 */

export const getPublishedBlogController = asyncErrorHandler(
  async (req, res, next) => {
    await refresh_blog_status();
    const { slug } = req.params;

    const blog = await Blog.findOne({ slug: slug })
      .populate<{ user: HydratedDocument<IUser> }>("user", "_id name email bio")
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

/**
 * @description Retrieves a blog by its ID.
 * @route GET /get-blog/:id
 * @param req - The HTTP request object.
 * @param req.params - Parameters from the URL, including `id` which is the unique identifier for the blog post.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response containing the fetched blog.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Blog fetched successfully').
 * @returns data - Contains the details of the fetched blog.
 * @howItWorks
 * - Retrieves the `id` parameter from the request URL, which identifies the blog post.
 * - Searches the database for a blog post with the matching ID.
 * - Populates the `user` field of the blog post with details such as `_id`, `name`, `email`, and `bio`.
 * - If the blog post is not found, it generates a `NOT_FOUND` error.
 * - If the blog post is found, it returns a success response with the blog post data.
 */

export const getBlogController = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const blog = await Blog.findById({ _id: new mongoose.Types.ObjectId(id) })
    .populate<{ user: HydratedDocument<IUser> }>("user", "_id name email bio")
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

/**
 * @description Retrieves all blogs authored by the authenticated user.
 * @route GET /my-blogs
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 * @param _next - The next middleware function in the stack (not used).
 * @returns A JSON response containing the fetched blogs.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Blogs fetched successfully').
 * @returns data - Contains the details of the fetched blogs.
 * @howItWorks
 * - Calls `refresh_blog_status()` to ensure the latest blog statuses are available.
 * - Asserts that the user accessing the route is authenticated and retrieves the user's ID from the response locals.
 * - Retrieves all blog posts from the database authored by the authenticated user (`user_id`).
 * - Excludes the body content (`-body`) of each blog post for efficiency.
 * - Populates the `user` field of each blog post with details such as `_id`, `name`, `email`, and `bio`.
 * - Sorts the retrieved blogs by their `updatedAt` date in descending order (newest first).
 * - Returns a success response with the fetched blogs data.
 */

export const myBlogsController = asyncErrorHandler(async (req, res, _next) => {
  await refresh_blog_status();
  assertProtectedUser(res);

  const user_id = res.locals.user_id;
  const blogs = await Blog.find({ user: user_id }, "-body")
    .populate<{ user: HydratedDocument<IUser> }>("user", "_id name email bio")
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
 * @returns - Returns a JSON object containing the retrieved blogs.
 */
/**
 * @description Retrieves all published blogs, excluding draft blogs.
 * @route GET /
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response containing the fetched blogs.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Blogs fetched successfully').
 * @returns data - Contains the details of the fetched blogs.
 * @howItWorks
 * - Calls `refresh_blog_status()` to ensure the latest blog statuses are available.
 * - Retrieves all blog posts from the database that are not in draft status (`status: { $ne: BlogStatus.Draft }`).
 * - Excludes the body content (`-body`) of each blog post for efficiency.
 * - Populates the `user` field of each blog post with details such as `_id`, `name`, `email`, and `bio`.
 * - Sorts the retrieved blogs by their `updatedAt` date in descending order (newest first).
 * - If no blogs are found, generates a `NOT_FOUND` error.
 * - Returns a success response with the fetched blogs data.
 */

export const getAllBlogsController = asyncErrorHandler(
  async (req, res, next) => {
    await refresh_blog_status();
    const blogs = await Blog.find(
      { status: { $ne: BlogStatus.Draft } },
      "-body",
    )
      .populate<{ user: HydratedDocument<IUser> }>("user", "_id name email bio")
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
 * @returns - Returns a JSON object confirming the creation of the blog.
 */
/**
 * @description Creates a new blog post based on the provided data.
 * @route POST /create-blog
 * @param req - The HTTP request object.
 * @param req.body - The data containing information required to create the blog post.
 * @param req.body.title - The title of the blog post.
 * @param req.body.byliner - The author or byliner of the blog post.
 * @param req.body.slug - The slug or unique identifier for the blog post URL.
 * @param req.body.body - The main content body of the blog post.
 * @param req.body.category_id - The category ID associated with the blog post.
 * @param req.body.meta_title - The meta title for SEO of the blog post.
 * @param req.body.meta_description - The meta description for SEO of the blog post.
 * @param req.body.user_id - The ID of the user creating the blog post.
 * @param req.body.status - Optional. The status of the blog post (Draft, Pending, Published, Approved).
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Blog created successfully' or 'Blog saved as draft successfully').
 * @returns data - Contains details of the created blog.
 * @howItWorks
 * - Asserts that the user accessing the route is authenticated and retrieves the user's ID from the response locals.
 * - Validates the presence of required fields (`title`, `byliner`, `slug`, `body`, `category_id`, `meta_title`, `meta_description`, `user_id`).
 * - Sets the default status of the blog post to `Draft` if not provided or invalid.
 * - Creates a new `Blog` document with the provided data and saves it to the database.
 * - Logs the creation of the blog post and sends an email notification if the blog status is `Pending`.
 * - Returns a success response with the created blog post data and appropriate message based on its status.
 */

export const createBlogController = asyncErrorHandler(
  async (req, res, next) => {
    assertProtectedUser(res);

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

    const user_id = res.locals.user_id;
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

    console.log(`Blog created by user ${user_id}`, blog);

    if (blog.status === BlogStatus.Pending) {
      blogForApprovalMail(blog);
    }

    console.log("Blog created", blog, "by user", res.locals.user);
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

/**
 * @description Updates an existing blog post with new data.
 * @route PUT /update-blog/:id
 * @param req - The HTTP request object.
 * @param req.body - The data containing updated information for the blog post.
 * @param req.body.blog - The existing blog post document to be updated.
 * @param req.body.blog._id - The ID of the blog post to update.
 * @param req.body.blog.title - Optional. The updated title of the blog post.
 * @param req.body.blog.byliner - Optional. The updated author or byliner of the blog post.
 * @param req.body.blog.slug - Optional. The updated slug or unique identifier for the blog post URL.
 * @param req.body.blog.body - Optional. The updated main content body of the blog post.
 * @param req.body.blog.category_id - Optional. The updated category ID associated with the blog post.
 * @param req.body.blog.meta_title - Optional. The updated meta title for SEO of the blog post.
 * @param req.body.blog.meta_description - Optional. The updated meta description for SEO of the blog post.
 * @param req.body.blog.user_id - Optional. The ID of the user updating the blog post.
 * @param req.body.blog.status - Optional. The updated status of the blog post (Draft, Pending, Published, Approved).
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Blog updated successfully!').
 * @returns data - Contains details of the updated blog.
 * @howItWorks
 * - Retrieves the existing blog post (`blog`) from the request body.
 * - Updates the blog post with new data (`req.body`) while running validators and returning the updated document (`new: true`).
 * - Checks if the status of the blog post has changed to `Published` and sends a publication email notification if applicable.
 * - If the update operation fails, generates an internal server error.
 * - Logs the update of the blog post and returns a success response with the updated blog post data and message.
 */

export const updateBlogController = asyncErrorHandler(
  async (req, res, next) => {
    const blog = req.body.blog as HydratedDocument<IBlog>;

    const updated_blog = await blog.updateOne(req.body, {
      new: true,
      runValidators: true,
    });

    if (
      blog.status !== BlogStatus.Published &&
      updated_blog.status == BlogStatus.Published
    ) {
      blogPublishedMail(updated_blog);
    }

    if (!updated_blog) {
      const error = new CustomError(
        "Some error occured! Blog not updated.",
        StatusCode.INTERNAL_SERVER_ERROR,
      );
      return next(error);
    }

    console.log("Updated blog", blog, "by user", res.locals.user);

    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog updated successfully!",
      data: updated_blog,
    });
  },
);

/**
 * Update a blog by ID.
 * @returns - Returns a JSON object containing the updated blog.
 */
/**
 * @description Updates a draft blog post with new data or changes its status.
 * @route PUT /update-blog/:id
 * @param req - The HTTP request object.
 * @param req.params.id - The ID of the draft blog post to update.
 * @param req.body - The data containing updated information or status for the draft blog post.
 * @param req.body.status - Optional. The updated status of the blog post (Draft, Pending, Published, Approved).
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Blog updated successfully!' or 'Blog submitted for approval!').
 * @howItWorks
 * - Retrieves the ID of the draft blog post (`id`) from the request parameters.
 * - Retrieves the existing blog post (`blog`) with the specified ID.
 * - If the blog post is not found, generates a `NOT_FOUND` error.
 * - If the blog post is not a draft, logs a message and passes the request to the next middleware.
 * - Sets the status of the blog post to `Draft` if not provided or invalid.
 * - Updates the blog post with new data or status while running validators and returning the updated document (`new: true`).
 * - If the status of the updated blog post is `Pending`, sends a success response and triggers an email notification for approval.
 * - Otherwise, sends a success response indicating the blog post was updated successfully.
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
      console.error(
        "Blog is not a draft, needs god like permission to edit! Lets see if you have them.",
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

    console.log("Updated blog", blog, "by user", res.locals.user);

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
 * @returns - Returns a JSON object confirming the published blog.
 */
/**
 * @description Publishes a blog post, updating its status to 'Published' and setting the published_at timestamp.
 * @route PUT /publish-blog/:id
 * @param req - The HTTP request object.
 * @param req.params.id - The ID of the blog post to publish.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Blog published successfully').
 * @howItWorks
 * - Retrieves the ID of the blog post (`id`) from the request parameters.
 * - Sets the status of the blog post in the database to 'Published' and updates the published_at field to the current date/time.
 * - Throws an error if the blog post is not found.
 * - Logs the successful publication of the blog post.
 * - Sends a success response indicating the blog post was published.
 * - Sends an email notification to the appropriate recipients about the newly published blog post.
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
 * @returns The updated blog object in the response.
 */
/**
 * @description Approves a blog post for publishing at a specified time, updating its status to 'Approved' and setting the scheduled publish time.
 * @route PUT /approve-blog/:id
 * @param req - The HTTP request object.
 * @param req.params.id - The ID of the blog post to approve.
 * @param req.body.time - The scheduled time for publishing the blog post.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Blog will soon be published').
 * @howItWorks
 * - Retrieves the ID of the blog post (`id`) from the request parameters.
 * - Retrieves the scheduled publish time (`time`) from the request body.
 * - Validates the request parameters and ensures the publish time is in the future.
 * - Sets the status of the blog post in the database to 'Approved' and updates the published_at field to the scheduled time.
 * - Throws an error if the blog post is not found or if the publish time is invalid.
 * - Logs the successful approval of the blog post.
 * - Sends a success response indicating the blog post has been approved for publishing.
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
 * @returns A JSON response indicating the success of the operation.
 */
/**
 * @description Refreshes the status of all blogs, ensuring they are up-to-date with the latest changes.
 * @route GET /blogs/refresh
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 * @param _next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Blog status refreshed successfully').
 * @returns data - Contains any data relevant to the operation, typically indicating the number of blogs updated.
 * @howItWorks
 * - Invokes the function `refresh_blog_status` to update the status of all blogs.
 * - Responds with a success message and data indicating the status refresh operation was successful.
 * - This function is typically used to synchronize and update the status of blogs across the application.
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

/**
 * @description Submits a blog post for approval, updating its status to 'Pending'.
 * @route PUT /submit-for-approval/:id
 * @param req - The HTTP request object.
 * @param req.params.id - The ID of the blog post to submit for approval.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Blog submitted for approval').
 * @howItWorks
 * - Retrieves the ID of the blog post (`id`) from the request parameters.
 * - Updates the status of the blog post in the database to 'Pending'.
 * - Throws an error if the blog post is not found.
 * - Logs the submission of the blog post for approval.
 * - Sends a success response indicating the blog post was submitted for approval.
 * - Sends an email notification to the appropriate recipients about the blog post awaiting approval.
 */

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

    console.log(
      "Blog submitted for approval",
      updatedBlog,
      "by user",
      res.locals.user,
    );

    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog submitted for approval",
      data: updatedBlog,
    });
    blogForApprovalMail(updatedBlog);
  },
);

/**
 * @description Deletes a draft blog post belonging to the authenticated user, including associated files (cover image and thumbnail).
 * @route DELETE /delete-blog/:id
 * @param req - The HTTP request object.
 * @param req.params.id - The ID of the blog post to delete.
 * @param req.body.user_id - The ID of the authenticated user.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Blog deleted successfully').
 * @howItWorks
 * - Retrieves the ID of the blog post (`id`) and the ID of the authenticated user (`user_id`) from request parameters and body, respectively.
 * - Finds the blog post in the database based on its ID.
 * - Throws an error if the blog post is not found.
 * - Checks if the blog post status is 'Draft' and if the authenticated user is the owner of the blog post.
 * - Deletes the blog post from the database if conditions are met.
 * - Logs the deletion of the draft blog post.
 * - Sends a success response indicating the blog post was deleted.
 * - If the blog post had a cover image and thumbnail, attempts to delete them from the filesystem.
 */

export const deleteMyBlogController = asyncErrorHandler(
  async (req, res, next) => {
    const user_id = new mongoose.Types.ObjectId(req.body.user_id);
    const { id } = req.params;
    const blog = await Blog.findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    if (!blog) {
      const err = new CustomError("Blog not found", StatusCode.NOT_FOUND);
      return next(err);
    }
    if (
      blog.status != BlogStatus.Draft ||
      !user_id.equals(blog.user.toString())
    ) {
      req.body.blog = blog;
      return next();
    }
    await blog.deleteOne();
    console.log("Draft deleted", blog, "by user", res.locals.user);

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

/**
 * @description Deletes a blog post along with its associated files (cover image and thumbnail).
 * @route DELETE /delete-blog/:id
 * @param req - The HTTP request object.
 * @param req.body.blog - The blog post to delete.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Blog deleted successfully').
 * @howItWorks
 * - Retrieves the blog post (`blog`) to delete from the request body.
 * - Throws an error if the blog post is not found.
 * - Deletes the blog post from the database.
 * - Logs the deletion of the blog post.
 * - Sends a success response indicating the blog post was deleted.
 * - If the blog post had a cover image and thumbnail, attempts to delete them from the filesystem.
 */

export const deleteBlogController = asyncErrorHandler(
  async (req, res, next) => {
    const blog: HydratedDocument<IBlog> = req.body.blog;

    if (!blog) {
      const error = new CustomError("Some error occured! Blog not deleted");
      return next(error);
    }

    await blog.deleteOne();

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

/**
 * @description Allows a user to take down their own blog post by changing its status to Pending or Draft.
 * @route PUT /take-down-blog/:id
 * @param req - The HTTP request object.
 * @param req.params.id - The ID of the blog post to take down.
 * @param req.body.make_pending - Optional. Set to true to change status to Pending, false to Draft.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Blog taken down successfully').
 * @howItWorks
 * - Retrieves the ID of the blog post (`id`) from the request parameters.
 * - Retrieves the blog post (`blog`) with the specified ID.
 * - Throws a `NOT_FOUND` error if the blog post is not found.
 * - Asserts that the user is authorized to perform the action using `assertProtectedUser`.
 * - If the user owns the blog post and it is not yet published, changes its status based on the `make_pending` flag:
 *   - If `make_pending` is true, sets the status to Pending.
 *   - If `make_pending` is false or undefined, sets the status to Draft.
 * - If the blog post is not owned by the user or is already published, passes the request to the next middleware.
 * - Logs the action of taking down the blog post and sends a success response with the updated blog post data.
 */

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
    assertProtectedUser(res);
    if (
      res.locals.user_id.equals(blog.user.toString()) &&
      blog.status !== BlogStatus.Published
    ) {
      // user can take down their own blog if not published
      const make_pending: boolean | undefined = req.body.make_pending;
      if (make_pending) {
        blog.status = BlogStatus.Pending;
      } else {
        blog.status = BlogStatus.Draft;
      }
      await blog.save();
    } else {
      res.locals.blog = blog;
      return next();
    }

    console.log("Blog taken down", blog, "by user", res.locals.user);

    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog taken down successfully",
      data: blog,
    });
  },
);

/**
 * @description Changes the status of a blog post to either Pending or Draft.
 * @route PUT /take-down-blog/:id
 * @param req - The HTTP request object.
 * @param req.body.make_pending - Optional. Set to true to change status to Pending, false to Draft.
 * @param res - The HTTP response object.
 * @param _next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Blog taken down successfully').
 * @howItWorks
 * - Retrieves the blog post (`blog`) from the response locals.
 * - Throws a `NOT_FOUND` error if the blog post is not found.
 * - Changes the status of the blog post based on the `make_pending` flag:
 *   - If `make_pending` is true, sets the status to Pending.
 *   - If `make_pending` is false or undefined, sets the status to Draft.
 * - Saves the updated status of the blog post.
 * - Logs the action of taking down the blog post and sends a success response with the updated blog post data.
 */
export const takeDownBlogController = asyncErrorHandler(
  async (req, res, _next) => {
    const make_pending: boolean | undefined = req.body.make_pending;
    const blog = res.locals.blog;
    if (!blog) {
      console.error(blog, res.locals);
      const error = new CustomError(
        "Assertion failed: Blog not found",
        StatusCode.NOT_FOUND,
      );
      throw error;
    }
    if (make_pending) {
      blog.status = BlogStatus.Pending;
    } else {
      blog.status = BlogStatus.Draft;
    }
    await blog.save();

    console.log("Blog taken down", blog, "by user", res.locals.user);
    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blog taken down successfully",
      data: blog,
    });
  },
);
