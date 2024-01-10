import asyncErrorHandler from "../helpers/asyncErrorHandler";
import CustomError from "../../config/CustomError";
import { Blog, BlogStatus } from "../models/blogModel";
import * as UserService from "../services/userService";
import { NextFunction, Request, Response } from "express";


/**
 * Get all blogs.
 *
 * @function
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Object} - Returns a JSON object containing the retrieved blogs.
 */
export const getAllBlogsController = asyncErrorHandler(async (req, res, next) => {
    await refresh_blog_status();
    const blogs = await Blog.find({}, '-body').sort({ created_at: -1 }).lean();

    if (!blogs || blogs.length === 0) {
        const error = new CustomError("No blogs found", 201);
        return next(error);
    }

    res.status(200).json({
        status: "success",
        message: "Blogs fetched successfully",
        data: blogs
    })
})

/**
 * Create a new blog.
 *
 * @function
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Object} - Returns a JSON object confirming the creation of the blog.
 */
export const createBlogController = asyncErrorHandler(async (req, res, next) => {
    const requiredFields = ['title', 'biliner', 'slug', 'body', 'category_id', 'meta_title', 'meta_description'];
    // the condition !req.body[field] failed for category_id = 0
    const missingField = requiredFields.find(field => req.body[field] === undefined || req.body[field] === null);
    // umm ok we allow empty strings here, but ok itna dimag kon lagata hai

    if (missingField) {
        const error = new CustomError(`Please enter ${missingField.replace('_', ' ')}`, 400);
        return next(error);
    }

    const email = req.user;
    const foundUser = await UserService.checkUserExists(email);

    if (!foundUser) {
        const error = new CustomError("No user exists with this email.", 401);
        return next(error);
    }

    const { _id: user_id } = foundUser;

    const newBlogData = {
        ...req.body,
        user_id
    };

    const blog = new Blog(newBlogData);
    await blog.save();

    res.status(200).json({
        status: "success",
        message: "Blog created successfully",
        data: blog
    });
});

/**
 * Update a blog by ID.
 *
 * @function
 * @param {Request} req - Express request object containing blog data.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Object} - Returns a JSON object containing the updated blog.
 */
export const updateBlogController = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params
    const blog = await Blog.findByIdAndUpdate(id, { ...req.body }, { new: true })

    if (!blog) {
        const error = new CustomError("Blog not found", 404);
        return next(error);
    }

    res.status(200).json({
        status: "success",
        message: "Blog updated successfully",
        data: blog
    })
})

/**
 * Publish a blog by ID.
 *
 * @function
 * @param {Request} req - Express request object containing blog ID.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Object} - Returns a JSON object confirming the published blog.
 */
export const publishBlogController = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const currentDate = new Date();
    const updatedBlog = await Blog.findByIdAndUpdate(
        id,
        {
            status: BlogStatus.Published,
            published_at: currentDate // Set the published_at field to the current date/time
        },
        { new: true }
    );

    res.status(200).json({
        status: "success",
        message: "Blog published successfully",
        data: updatedBlog
    })
})

/**
 * Approves a blog by updating its status to "Approved" and setting the published_at field to the current date/time.
 * This implements posting blogs with a future publish timestamp.
 * 
 * If the provided id or time is invalid, it returns a 400 error.
 * If the publish timestamp is in the past, it returns a 418 error (I'm a teapot).
 * 
 * @function
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Object} The updated blog object in the response.
 */
export const approveBlogController = asyncErrorHandler(async (req, res, next) => {
    const { id, time } = req.params;
    if (!id || !time) {
        const error = new CustomError("Invalid request", 400);
        return next(error);
    }
    const publish_timestamp = new Date(time);
    if (!publish_timestamp) {
        const error = new CustomError("Invalid request", 400);
        return next(error);
    }
    const currentDate = new Date();
    if (currentDate > publish_timestamp) {
        // i am a teapot
        const error = new CustomError("You can't change the past buddy, that's how life is. The puslish timings should be somewhere in the future.", 418);
        return next(error);
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
        id,
        {
            status: BlogStatus.Approved,
            published_at: publish_timestamp // Set the published_at field to the current date/time
        },
        { new: true }
    );
    res.status(200).json({
        status: "success",
        message: "Blog will soon be published",
        data: updatedBlog
    })
})

/**
 * Refreshes the status of a blog. Makes the blog with status "Approved" and publish date in the past to "Published".
 * 
 * @function
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Object} A JSON response indicating the success of the operation.
 */
export const refreshBlogStatus = asyncErrorHandler(async (req, res, next) => {
    const updation = await refresh_blog_status();
    res.status(200).json({
        status: "success",
        message: "Blog status refreshed successfully",
        data: updation
    })
})

/**
 * Refreshes the status of blogs from "Approved" to "Published" if their publish date has passed.
 * @returns A promise that resolves to an object representing the result of the update operation.
 */
async function refresh_blog_status(): Promise<import("mongoose").UpdateWriteOpResult> {
    return await Blog.updateMany(
        { status: BlogStatus.Approved, published_at: { $lte: new Date() } },
        { status: BlogStatus.Published }
    );
}