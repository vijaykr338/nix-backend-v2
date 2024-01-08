import asyncErrorHandler from "../helpers/asyncErrorHandler.js";
import CustomError from "../../config/CustomError.js";
import { Blog } from "../models/blogModel.js";


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
        blogs
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
    const { title, biliner, slug, body, category_id, meta_title, meta_description } = req.body;
    if (!title || !biliner || !slug || !body || !category_id || !meta_title || !meta_description) {
        const error = new CustomError("Please enter all fields", 400);
        return next(error);
    }

    const blog = new Blog(req.body);
    await blog.save();

    res.status(200).json({
        status: "success",
        message: "Blog created successfully",
        blog
    })
})

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
        blog
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
    const updatedBlog = await Blog.findByIdAndUpdate(id, { status: 'published' }, { new: true });

    if (!updatedBlog) {
        const error = new CustomError("Blog not found", 404);
        return next(error);
    }

    res.status(200).json({
        status: "sucess",
        message: "Blog published successfully",
        updatedBlog
    })
})