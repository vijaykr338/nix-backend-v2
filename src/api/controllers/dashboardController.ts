import asyncErrorHandler from "../helpers/asyncErrorHandler";
import { Blog, BlogStatus } from '../models/blogModel';
import StatusCode from "../helpers/httpStatusCode";
import CustomError from "../../config/CustomError";

export const getTopUsers = asyncErrorHandler(async (req, res, next) => {
    const topUsers = await Blog.aggregate([
        {
            $match: { status: BlogStatus.Published },
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
            $limit: 10,
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
                "totalPublishedBlogs": 1,
                "userDetails.name": 1,
                "userDetails.email": 1,
                "userDetails.bio": 1,
            },
        }
    ]);

    if (!topUsers || topUsers.length == 0) {
        const error = new CustomError("No published blogs yet", StatusCode.NOT_FOUND);
        return next(error);
    }

    res.status(StatusCode.OK).json({
        status: "success",
        message: "Top users fetched successfully",
        data: topUsers,
    });
})

export const getBlogsInEachCategory = asyncErrorHandler(async (req, res, next) => {
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

    const result: Record<string, number> = {};

    blogCountsByCategory.forEach((category) => {
        const categoryName = BlogStatus[category._id];
        result[categoryName] = category.count;
    });

    res.status(StatusCode.OK).json({
        status: "success",
        message: "Blogs in each category fetched successfully",
        data: result,
    });
});