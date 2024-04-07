import asyncErrorHandler from "../helpers/asyncErrorHandler";
import { Blog, BlogStatus } from "../models/blogModel";
import StatusCode from "../helpers/httpStatusCode";
import CustomError from "../../config/CustomError";

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
