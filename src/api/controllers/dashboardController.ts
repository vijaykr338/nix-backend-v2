import asyncErrorHandler from "../helpers/asyncErrorHandler";
import { Blog, BlogStatus } from "../models/blogModel";
import StatusCode from "../helpers/httpStatusCode";
import CustomError from "../../config/CustomError";

/**
 * @description Fetches the top 10 users who have published the most blogs in the last 4 years.
 * @route GET /top-users
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Top users fetched successfully').
 * @returns data - Contains an array of top users with their publication statistics.
 * @howItWorks
 * - Aggregates data from the `Blog` collection to find users with the highest number of published blogs in the last 4 years.
 * - Filters out any users associated with the email service.
 * - Limits the results to the top 10 users.
 * - Looks up and includes additional user details (`name`, `email`, `bio`) from the `users` collection.
 * - Responds with the top users' data, or an error message if no blogs are found.
 */

export const getTopUsers = asyncErrorHandler(async (req, res, next) => {
  const top_users_queried = await Blog.aggregate([
    {
      $match: {
        status: BlogStatus.Published,
        createdAt: {
          $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 4)),
        },
      },
    },
    {
      $group: {
        _id: "$user",
        totalPublishedBlogs: { $sum: 1 },
      },
    },
    {
      $sort: { totalPublishedBlogs: -1 },
    },
    {
      $limit: 11,
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: "$userDetails",
    },
    {
      $project: {
        totalPublishedBlogs: 1,
        "userDetails.name": 1,
        "userDetails.email": 1,
        "userDetails.bio": 1,
      },
    },
  ]);

  // placeholder id for old blogs without owner
  const top_users = top_users_queried
    .filter(
      (user) => user.userDetails?.email !== process.env.EMAIL_SERVICE_USER,
    )
    .slice(0, 10);

  if (!top_users_queried || top_users_queried.length == 0) {
    const error = new CustomError(
      "No published blogs yet to generate a leaderboard",
      StatusCode.NOT_FOUND,
    );
    return next(error);
  }

  res.status(StatusCode.OK).json({
    status: "success",
    message: "Top users fetched successfully",
    data: top_users,
  });
});

/**
 * @description Fetches the count of blogs in each category.
 * @route GET /blogs-by-category
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Blogs in each category fetched successfully').
 * @returns data - Contains an object mapping each blog status category to its count.
 * @howItWorks
 * - Aggregates data from the `Blog` collection to group blogs by their status and count the number of blogs in each category.
 * - Converts the aggregation result into an object with category names as keys and their respective counts as values.
 * - Responds with the count of blogs in each category, or an error message if no blogs are found.
 */

export const getBlogsCountInEachCategory = asyncErrorHandler(
  async (req, res, next) => {
    const blogCountsByCategory = await Blog.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    if (!blogCountsByCategory || blogCountsByCategory.length === 0) {
      const error = new CustomError("No blogs", StatusCode.NOT_FOUND);
      return next(error);
    }

    const result = Object.fromEntries(
      blogCountsByCategory.map((category) => {
        const categoryName = BlogStatus[category._id];
        return [categoryName, category.count];
      }),
    );

    res.status(StatusCode.OK).json({
      status: "success",
      message: "Blogs in each category fetched successfully",
      data: result,
    });
  },
);
