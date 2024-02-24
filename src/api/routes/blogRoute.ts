import express from "express";
import { approveBlogController, createBlogController, deleteBlogController, deleteMyBlogController, getAllBlogsController, getBlogController, getMyBlogController, getPublishedBlogsController, myBlogsController, publishBlogController, submitForApprovalController, takeDownBlogController, updateBlogController } from "../controllers/blogController";
import Permission from "../helpers/permissions";
import { protect } from "../middlewares/authMiddleware";
import protected_route from "../middlewares/permsMiddlewareInit";

const router = express.Router();

const createBlogProtect = protected_route([Permission.CreateBlog]);
const readBlogProtect = protected_route([Permission.ReadBlog]);
const updateBlogProtect = protected_route([Permission.UpdateBlog]);
const publishBlogProtect = protected_route([Permission.PublishBlog]);
const deleteBlogProtect = protected_route([Permission.DeleteBlog]);

//  protected for admins who can read all blogs except users' drafts
router.route("/").get(protect, readBlogProtect, getAllBlogsController);

// for the main dtutimes frontend
router.route("published-blogs").get(getPublishedBlogsController);

// protected for "Your Stories" page (all blogs by this user ONLY)
router.route("/my-blogs").get(protect, myBlogsController);

// blogs by this user ONLY (including drafts) + blogs by other users if person is an admin (with read rights)
router.route("/get-blog/:id").get(protect, getMyBlogController, readBlogProtect, getBlogController);

// protected for creating a new blog
router.route("/create-blog").post(protect, createBlogProtect, createBlogController);

// protected for updating a draft blogs
router.route("/update-blog/:id").put(protect, updateBlogProtect, updateBlogController);

// protected for publishing a pending blog
router.route("/publish-blog/:id").put(protect, publishBlogProtect, publishBlogController);

// user can submit their drafts for approval this will change its status to pending
router.route("/submit-for-approval/:id").put(protect, createBlogProtect, submitForApprovalController);

// admins can approve pending blogs
router.route("/approve-blog/:id").put(protect, publishBlogProtect, approveBlogController);

// admins can change pending/approved/published blogs to draft
router.route("/take-down-blog/:id").put(protect, deleteBlogProtect, takeDownBlogController);

// protected for deleting a blog by admin or drafts by user
router.route("/delete-blog/:id").delete(protect, deleteMyBlogController, deleteBlogProtect, deleteBlogController);

export default router;