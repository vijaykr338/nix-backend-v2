import express from "express";
import { protect } from "../middlewares/authMiddleware";
import protected_route from "../middlewares/permsMiddlewareInit";
import Permission from "../helpers/permissions";
import { approveBlogController, createBlogController, deleteBlogController, getAllBlogsController, publishBlogController, submitForApprovalController, takeDownBlogController, updateBlogController } from "../controllers/blogController";

const router = express.Router();

//permissions
const createBlogProtect = protected_route([Permission.CreateBlog]);
const readBlogProtect = protected_route([Permission.ReadBlog]);
const updateBlogProtect = protected_route([Permission.UpdateBlog]);
const publishBlogProtect = protected_route([Permission.PublishBlog]);
const deleteBlogProtect = protected_route([Permission.DeleteBlog]);

//routes
router.route("/").get(protect, readBlogProtect, getAllBlogsController);
router.route("/create-blog").post(protect, createBlogProtect, createBlogController);
router.route("/update-blog/:id").put(protect, updateBlogProtect, updateBlogController);
router.route("/publish-blog/:id").put(protect, publishBlogProtect, publishBlogController);
router.route("/submit-for-approval/:id").put(protect, createBlogProtect, submitForApprovalController);
router.route("/approve-blog/:id").put(protect, publishBlogProtect, approveBlogController);
router.route("/update-blog/:id").put(protect, updateBlogProtect, updateBlogController);
router.route("/take-down-blog/:id").put(protect, updateBlogController, takeDownBlogController);
router.route("/delete-blog/:id").delete(protect, deleteBlogProtect, deleteBlogController);

// todo: delete blog route



export default router;