import asyncErrorHandler from "../helpers/asyncErrorHandler.js";
import CustomError from "../../config/CustomError.js";
import { Blog } from "../models/blogModel.js";
import * as UserService from "../services/userService.js";


/**
 * Get all blogs.
 *
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - Returns a JSON object containing the retrieved blogs.
 */
export const getAllBlogsController = asyncErrorHandler(async (req, res, next) => {
    const blogs = await Blog.find({}, '-body').sort({ created_at: -1 }).lean();

    if (!blogs || blogs.length === 0) {
        const error = new CustomError("No blogs found", 201);
        return next(error);
    }

    res.status(200).json({
        status: "success",
        message: "Blogs fetched successfully",
        data: [blogs]
    })
})

/**
 * Create a new blog.
 *
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - Returns a JSON object confirming the creation of the blog.
 */
export const createBlogController = asyncErrorHandler(async (req, res, next) => {
    const requiredFields = ['title', 'biliner', 'slug', 'body', 'category_id', 'meta_title', 'meta_description'];
    const missingField = requiredFields.find(field => !req.body[field]);

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
        data: [blog]
    });
});

/**
 * Update a blog by ID.
 *
 * @function
 * @param {Object} req - Express request object containing blog data.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
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
        data: [blog]
    })
})

/**
 * Publish a blog by ID.
 *
 * @function
 * @param {Object} req - Express request object containing blog ID.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - Returns a JSON object confirming the published blog.
 */
export const publishBlogController = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const currentDate = new Date();
    const updatedBlog = await Blog.findByIdAndUpdate(
        id,
        {
            status: 'published',
            published_at: currentDate // Set the published_at field to the current date/time
        },
        { new: true }
    );

    res.status(200).json({
        status: "sucess",
        message: "Blog published successfully",
        data: [updatedBlog]
    })
})